# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template



### 配置 AWS CLI 凭证

[aws cli インストール](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

#### 第一步：在 AWS 控制台获取凭证 (IAM User)
如果你还没有 Access Key，需要创建一个：

1. 登录 AWS 管理控制台。

2. 在搜索栏输入 IAM，进入 IAM 服务。

3. 点击左侧菜单栏的 Users（用户），点击 Create user（或者选择一个现有用户）。

权限设置：如果是个人练习，可以附加 AdministratorAccess 策略（注意安全，不要泄露密钥）。

4. 用户创建后，点击该用户的名字进入详情页，切换到 Security credentials（安全凭证）选项卡。

5. 找到 Access keys 区域，点击 Create access key。

6. 选择 Command Line Interface (CLI)，勾选确认，点击下一步。

重要：生成后你会看到 Access Key ID 和 Secret Access Key。请立即下载 CSV 文件或保存到记事本，因为 Secret Key 以后再也看不到了。

#### 第二步：在终端配置凭证

打开你的命令行（终端、CMD 或 PowerShell），输入以下命令：

```Bash
aws configure
``` 

系统会依次提示你输入四项信息，按照你刚刚获得的密钥填写：

> AWS Access Key ID [None]: 输入你的 Access Key ID
> 
> AWS Secret Access Key [None]: 输入你的 Secret Access Key
> 
> Default region name [None]: ap-northeast-1（这是东京区域，如果你想用其他区可以改，如 us-east-1）
> 
> Default output format [None]: json（直接回车默认即可）

#### 第三步：验证是否成功

输入以下命令，如果能看到你的用户信息或不再报错，说明配置成功：

```Bash
aws sts get-caller-identity
```

输出示例：

```JSON
{
    "UserId": "AIDAXxxxxxxx",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-name"
}
```



## 部署到 AWS

在终端执行以下步骤：

1. 安装必要的依赖：

```Bash
npm install @types/aws-lambda esbuild
```
2. Bootstrap（如果是第一次在该区域部署 CDK）：

```Bash
cdk bootstrap
```

3. 查看生成的 CloudFormation 模板（可选）：

```Bash
cdk synth
```


4. 执行部署：

```Bash
cdk deploy
```

部署过程中会提示确认 IAM 权限更改，输入 y 即可。

## 验证与清理
验证：部署完成后，你可以登录 AWS Lambda 控制台找到 CdkHelloWorldLambda 并进行测试。

清理：如果你不想产生额外费用，可以删除该堆栈：

```Bash
cdk destroy
```

**💡 小贴士**

权限管理：如果你需要 Lambda 访问 S3 或 DynamoDB，可以在 Stack 代码中使用 myLambda.addToRolePolicy(...) 或 table.grantReadData(myLambda)。

环境变量：可以通过 environment: { KEY: 'VALUE' } 轻松在代码中注入配置。


**补充：**

这段看似冗长的代码其实是 AWS CDK 自动生成的“标配”，它的核心作用是 版本分析与遥测（Telemetry）。

简单来说，这是 CDK 用来向 AWS 报告“这个资源是由哪个版本的 CDK 生成的”的一种机制。

**如何关掉它？**
如果你觉得这部分代码让生成的模板太乱，或者不想向 AWS 发送版本信息，可以在 cdk.json 中配置：

```JSON
{
  "context": {
    "aws-cdk:usage-reporting": false
  }
}
```
或者在执行命令时加入：

```Bash

cdk synth --no-version-reporting
```
这样，生成的 CloudFormation 模板中这一大段逻辑就会消失。

```YAML
CDKMetadataAvailable:
    Fn::Or:
      - Fn::Or:
          - Fn::Equals:
              - Ref: AWS::Region
              - af-south-1
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-east-1
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-northeast-1
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-northeast-2
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-northeast-3
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-south-1
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-south-2
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-southeast-1
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-southeast-2
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-southeast-3
      - Fn::Or:
          - Fn::Equals:
              - Ref: AWS::Region
              - ap-southeast-4
          - Fn::Equals:
              - Ref: AWS::Region
              - ca-central-1
          - Fn::Equals:
              - Ref: AWS::Region
              - ca-west-1
          - Fn::Equals:
              - Ref: AWS::Region
              - cn-north-1
          - Fn::Equals:
              - Ref: AWS::Region
              - cn-northwest-1
          - Fn::Equals:
              - Ref: AWS::Region
              - eu-central-1
          - Fn::Equals:
              - Ref: AWS::Region
              - eu-central-2
          - Fn::Equals:
              - Ref: AWS::Region
              - eu-north-1
          - Fn::Equals:
              - Ref: AWS::Region
              - eu-south-1
          - Fn::Equals:
              - Ref: AWS::Region
              - eu-south-2
      - Fn::Or:
          - Fn::Equals:
              - Ref: AWS::Region
              - eu-west-1
          - Fn::Equals:
              - Ref: AWS::Region
              - eu-west-2
          - Fn::Equals:
              - Ref: AWS::Region
              - eu-west-3
          - Fn::Equals:
              - Ref: AWS::Region
              - il-central-1
          - Fn::Equals:
              - Ref: AWS::Region
              - me-central-1
          - Fn::Equals:
              - Ref: AWS::Region
              - me-south-1
          - Fn::Equals:
              - Ref: AWS::Region
              - sa-east-1
          - Fn::Equals:
              - Ref: AWS::Region
              - us-east-1
          - Fn::Equals:
              - Ref: AWS::Region
              - us-east-2
          - Fn::Equals:
              - Ref: AWS::Region
              - us-west-1
      - Fn::Equals:
          - Ref: AWS::Region
          - us-west-2
```

4. 如何关掉它？
如果你觉得这部分代码让生成的模板太乱，或者不想向 AWS 发送版本信息，可以在 cdk.json 中配置：

JSON

{
  "context": {
    "aws-cdk:usage-reporting": false
  }
}
或者在执行命令时加入：

Bash

cdk synth --no-version-reporting
这样，生成的 CloudFormation 模板中这一大段逻辑就会消失。
