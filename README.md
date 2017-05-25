# 概要
- GitHubのメンションをSlackに通知する
- コメントとプルリクのメンションに対応している
    - Slack側にメンションの通知が飛ぶようになる

# 動作環境
- Node.js
    - express

# Slackアプリの認証方法
- https://api.slack.com/applications でアプリケーションを新規作成
- 作成後のClient IDとClient Secretをメモしておく
- 以下のURLにアクセス
    - https://slack.com/oauth/authorize?client_id=【Client ID】&scope=chat:write:bot
- リダイレクト先のURLに code というパラメータが付与されているのでメモしておく
- 以下のURLにアクセス
    - https://slack.com/api/oauth.access?client_id=【Client ID】&client_secret=【Client Secret】&code=【code】
- 表示されたaccess_tokenが今後利用するトークンになる

# 設定方法
- 連携したいリポジトリのSettings画面を開く
- Webhookの追加画面を開く
- Payload URLとイベントは以下のように設定する
    - Issueの新規作成
        - http://domain/github_issue
        - Issue のみにチェックを入れる
    - Issueのコメントのメンション通知
        - http://domain/github_issue_comment
        - Issue comment のみにチェックを入れる
    - プルリクのメンション通知
        - http://domain/github_pullrequest
        - Pull Request のみにチェックを入れる
    - コードレビューのコメントのメンション通知
        - http://domain/github_commit_comment
        - Commit comment と Pull Request review comment にチェックを入れる
- Content Typeは `application/x-www-form-urlencoded` を設定
