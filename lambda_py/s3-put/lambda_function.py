import os
import urllib.parse
import boto3

s3 = boto3.client("s3")

def handler(event, context):

    BUCKET_NAME = os.environ.get("BUCKET_NAME")
    if not BUCKET_NAME:
        raise RuntimeError("BUCKET_NAME is not set")
    print(BUCKET_NAME)

    
    # event は S3Event 形式
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]
        key = urllib.parse.unquote_plus(key)  # '+' や %xx を元に戻す

        print(f"S3 PUT detected: bucket={bucket}, key={key}")

        # オブジェクト取得
        resp = s3.get_object(Bucket=bucket, Key=key)
        body_bytes = resp["Body"].read()

        # テキスト想定（CSVなど）。バイナリの場合は decode しないこと
        text = body_bytes.decode("utf-8", errors="replace")
        print("Object content (first 500 chars):", text[:500])

    return {"ok": True}
