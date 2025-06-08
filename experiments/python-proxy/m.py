from swiftshadow import QuickProxy
from requests import get

# Fetch a proxy
proxy = QuickProxy()

# Use the proxy with requests
resp = get('https://checkip.amazonaws.com', proxies=proxy.as_requests_dict())
print(resp.text)