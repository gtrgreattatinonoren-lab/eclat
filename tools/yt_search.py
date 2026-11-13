import sys, re, json, urllib.request, urllib.parse
def search(q, n=6):
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(q) + "&hl=ja&gl=JP"
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0","Accept-Language":"ja"})
    html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8","ignore")
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    data = json.loads(m.group(1))
    out=[]
    def walk(o):
        if isinstance(o, dict):
            if "videoRenderer" in o:
                v=o["videoRenderer"]
                try:
                    out.append({"id":v["videoId"],"title":v["title"]["runs"][0]["text"],
                      "ch":v.get("ownerText",{}).get("runs",[{}])[0].get("text",""),
                      "len":v.get("lengthText",{}).get("simpleText",""),
                      "views":v.get("viewCountText",{}).get("simpleText",""),
                      "age":v.get("publishedTimeText",{}).get("simpleText","")})
                except Exception: pass
            for x in o.values(): walk(x)
        elif isinstance(o, list):
            for x in o: walk(x)
    walk(data)
    return out[:n]
res={}
for q in sys.argv[1:]:
    try: res[q]=search(q)
    except Exception as e: res[q]=str(e)
print(json.dumps(res, ensure_ascii=False, indent=0))
