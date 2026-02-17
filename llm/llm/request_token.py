import requests


def request_token():
  url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

  payload={
    'scope': 'GIGACHAT_API_PERS'
  }
  headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'RqUID': 'c5f16a15-1ea9-42a9-a09a-1a25e8bcc5fb',
    'Authorization': 'Basic <Authorization key>'
  }

  response = requests.request("POST", url, headers=headers, data=payload, verify=False)

  return response.text
