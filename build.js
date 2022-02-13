const input = process.argv.slice(2)[0];
const uriEncoded = encodeURI(input);
const addressForBookmark = `javascript:${uriEncoded}`;

const webpage = `<html>
<head>
<meta charset="utf-8"/>
<style>
body { font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 20px }
a { padding: 5px 20px; background-color: #8888ff; color: white; text-decoration: none }
</style>
</head>
<body>
  <h3>아래 버튼을 북마크바에 드래그해 넣으세요</h3>
  <p><a href="${addressForBookmark}">CGV 자동 예매</a></p>
  <p style="margin-bottom: 0">사용법 영상:</p>
  <iframe width="420" height="315" src="https://www.youtube.com/embed/ikHZVfQZFCI" frameborder="0" allowfullscreen=""></iframe>
</body>
</html>`;

process.stdout.write(webpage);
