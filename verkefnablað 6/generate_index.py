import os

folder = "."  # current folder
output_file = "index.html"
script_file = os.path.basename(__file__)  # the name of this script

files = sorted(os.listdir(folder))

with open(output_file, "w", encoding="utf-8") as f:
    f.write("""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Folder Index</title>
<style>
body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
h1 { text-align: center; }
ul { list-style-type: none; padding-left: 0; }
li { margin: 5px 0; }
a { text-decoration: none; color: #0077cc; }
a:hover { text-decoration: underline; color: #005fa3; }
</style>
</head>
<body>
<h1>Folder Index</h1>
<ul>
""")
    for file in files:
        # Skip this script, the output index, and hidden files
        if file in {output_file, script_file} or file.startswith("."):
            continue
        path = file + ("/" if os.path.isdir(file) else "")
        f.write(f'<li><a href="{path}">{file}</a></li>\n')
    f.write("""
</ul>
</body>
</html>
""")

print(f"index.html generated with {len(files)} items (script and index skipped).")
