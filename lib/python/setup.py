from setuptools import setup, find_packages

with open("../../README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="claursor",
    version="1.0.0",
    author="Max Yeremenko",
    author_email="max@9pros.com",
    description="An API bridge between Cursor and Claude Desktop",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/9pros/claursor",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    install_requires=[
        "flask>=2.0.0",
        "requests>=2.25.0",
        "python-dotenv>=0.19.0",
    ],
    entry_points={
        "console_scripts": [
            "code-bridge-server=claursor.server:main",
        ],
    },
    include_package_data=True,
)
