import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface StaticSiteStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId: string;
}

export class StaticSiteStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);

    const { domainName, hostedZoneId } = props;

    // Import existing hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId,
        zoneName: domainName,
      }
    );

    // S3 bucket for static site - private, CloudFront-only access
    this.bucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: `${domainName.replace(/\./g, "-")}-site`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // ACM Certificate for HTTPS
    const certificate = new acm.Certificate(this, "SiteCertificate", {
      domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // CloudFront Origin Access Control for secure S3 access
    const oac = new cloudfront.S3OriginAccessControl(this, "OAC", {
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    // CloudFront Function to handle directory index.html rewrites
    const urlRewriteFunction = new cloudfront.Function(this, "UrlRewriteFunction", {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // If URI ends with '/', append index.html
  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  }
  // If URI doesn't have a file extension, append /index.html
  else if (!uri.includes('.')) {
    request.uri += '/index.html';
  }

  return request;
}
      `),
      functionName: "url-rewrite-stephenmccray",
    });

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, "SiteDistribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: urlRewriteFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      domainNames: [domainName],
      certificate,
      defaultRootObject: "index.html",
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // Route 53 A record pointing to CloudFront
    new route53.ARecord(this, "SiteARecord", {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution)
      ),
    });

    // IAM Role for GitHub Actions OIDC
    const githubOidcProvider = new iam.OpenIdConnectProvider(
      this,
      "GitHubOIDC",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIds: ["sts.amazonaws.com"],
      }
    );

    const deployRole = new iam.Role(this, "GitHubActionsDeployRole", {
      roleName: "stephenmccray-site-deploy",
      assumedBy: new iam.FederatedPrincipal(
        githubOidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:srmccray/personal-website:*",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    // S3 permissions for deploy role
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetObject",
        ],
        resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
      })
    );

    // CloudFront invalidation permission
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudfront:CreateInvalidation"],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, "BucketName", {
      value: this.bucket.bucketName,
      description: "S3 bucket name for website content",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
      description: "CloudFront distribution ID",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
      description: "CloudFront distribution domain name",
    });

    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${domainName}`,
      description: "Website URL",
    });

    new cdk.CfnOutput(this, "DeployRoleArn", {
      value: deployRole.roleArn,
      description: "IAM role ARN for GitHub Actions deployment",
    });
  }
}
