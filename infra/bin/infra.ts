#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StaticSiteStack } from "../lib/static-site-stack";

const app = new cdk.App();

new StaticSiteStack(app, "StephenMcCraySiteStack", {
  domainName: "stephenmccray.com",
  hostedZoneId: "ZKW7VVP2HVBFL",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1", // Required for CloudFront + ACM
  },
});
