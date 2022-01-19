javascript:(async function() {
    function getImage() {
        return new Promise((res, rej) => {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = e => { 
                var file = e.target.files[0]; 
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = readerEvent => res(readerEvent.target.result);
                reader.onerror = () => rej();
            };
            input.click();
        });
    };
    async function dopost(token, text, image) {
        const payload = {
            text: text || "",
            type: image ? "image" : "text",
            user_token: token,
            data: image || ""
        };
        const formBody = Object.keys(payload).map(key => 
            encodeURIComponent(key) + '=' + encodeURIComponent(payload[key])
        ).join('&');
        let url = new URL("https://pkuhelper.pku.edu.cn/services/pkuhole/api.php");
        let params = new URLSearchParams();
        params.append("action", "dopost");
        params.append("PKUHelperAPI", "3.0");
        params.append("jsapiver", "201027113050-456200");
        params.append("user_token", token);
        url.search = params;
        const resp = await fetch(url, {
            body: formBody,
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
        });
        const json = await resp.json();
        console.log(json);
        if (json.code === 1 && json.msg.indexOf("登录") !== -1) {
            alert("无效 TOKEN");
        } else if (json.code === 1 && json.msg === "Invalid image format") {
            alert("无效的图片");
        } else {
            alert("发送成功");
        }
    };
    let token = localStorage.TOKEN;
    let image = await getImage();
    image = image.substr(image.indexOf("base64,") + "base64,".length);
    let text = prompt("text");
    await dopost(token, text, image);
})();