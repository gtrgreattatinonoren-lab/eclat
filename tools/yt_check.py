"""YouTube動画が埋め込み可能か確認する: python tools/yt_check.py ID1 ID2 ...  (OKなら作者名とタイトルを表示)"""
import sys, json, urllib.request
for i in sys.argv[1:]:
    try:
        d = json.load(urllib.request.urlopen("https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=" + i, timeout=15))
        print("OK", i, d["author_name"], "|", d["title"])
    except Exception as e:
        print("NG", i, e)
