import os
import sys
from os import path
import markdown

if len(sys.argv) < 2:
	print("Usage: render.py src/")

src_dir = sys.argv[1]

for file in os.listdir(src_dir):
	if file.split(".")[-1] != "md":
		continue

	file_path = path.join(src_dir, file)
	page_name = file.split(".")[0]

	template_name = path.join(src_dir, "template-" + page_name + ".html")
	if not path.exists(template_name):
		template_name = path.join(src_dir, "template.html")

	print("Rendering %s with template %s" % (page_name, template_name))

	dest_name = page_name + ".html"

	rendered = ""
	with open(file_path, "r") as f:
		rendered = markdown.markdown(f.read(), extensions=['codehilite', 'fenced_code'])

	with open(template_name, "r") as f:
		contents = f.read()
		contents = contents.replace("@title", page_name)
		contents = contents.replace("@yield", rendered)
		with open(dest_name, "w") as d:
			d.write(contents)