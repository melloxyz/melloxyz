#!/usr/bin/env python3
"""Build an offline GitHub-style HTML preview from the current README."""
from pathlib import Path
import markdown

readme=Path('README.md').read_text(encoding='utf-8')
html=markdown.markdown(readme, extensions=['extra'])
root=Path.cwd().as_uri()+'/'
styles="""
* {box-sizing:border-box}
body {margin:0;padding:0;background:#ffffff;color:#1f2328;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main {max-width:960px;padding:32px 24px 64px;margin:0 auto;line-height:1.55}
h3 {font-size:1.28rem;line-height:1.4;margin:34px 0 18px;padding-bottom:9px;border-bottom:1px solid #d8dee5}
h4 {font-size:1.04rem;margin:24px 0 10px}
p {margin:0 0 16px}
a {color:#0969da;text-decoration:none}
img {max-width:100%;height:auto;vertical-align:middle}
picture {display:inline}
p picture {display:inline-block;max-width:100%;vertical-align:middle}
p picture img[height="40"] {height:40px;width:auto}
pre,code,samp {font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace}
code {background:rgba(127,127,127,.12);border-radius:4px;padding:2px 5px}
sub {font-size:.82rem;color:#636c76;vertical-align:baseline}
hr {border:0;border-top:1px solid #d8dee5;margin:28px 0}
@media(max-width:640px) {main{padding:14px 15px 42px}h3{margin-top:28px}p{margin-bottom:14px}}
@media(prefers-color-scheme:dark) {
body{background:#0d1117;color:#e6edf3}
h3,hr{border-color:#30363d}
a{color:#9ac7fa}
sub{color:#9ba8b8}
}
"""
out=Path('previews')
out.mkdir(exist_ok=True)
(out/'profile.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+root+'"><style>'+styles+'</style></head><body><main>'+html+'</main></body></html>',encoding='utf-8')
print('Created previews/profile.html')
