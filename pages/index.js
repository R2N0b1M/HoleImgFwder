import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useFilePicker } from 'use-file-picker';
import { ToastProvider, useToasts } from 'react-toast-notifications';
import {
  MDBInput,
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBFooter,
  MDBTypography,
} from 'mdb-react-ui-kit';

import 'mdb-react-ui-kit/dist/css/mdb.min.css';

function Form() {
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [previewAPNG, setPreviewAPNG] = useState(null);
  const [openFileSelector, { filesContent }] = useFilePicker({
    accept: 'image/*',
    readAs: 'DataURL',
    multiple: false,
  });
  const { addToast } = useToasts();

  const getFFmpeg = async () => {
    const { createFFmpeg } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
    return ffmpeg;
  }

  const convertGIFtoAPNG = async (GIF_base64) => {
    const GIF_raw = Uint8Array.from(atob(GIF_base64), c => c.charCodeAt(0));
    let ffmpeg;
    try {
      ffmpeg = await getFFmpeg();
    } catch (error) {
      addToast("无法加载 ffmpeg.js ，请检查网络后重试。", { appearance: 'error' });
      throw error;
    }
    try {
      ffmpeg.FS('writeFile', 'input.gif', GIF_raw);
      await ffmpeg.run('-i', 'input.gif', '-f', 'apng', '-plays', '0', 'output.png');
      const APNG_raw = await ffmpeg.FS('readFile', 'output.png');
      const APNG_base64 = btoa(APNG_raw.reduce((acc, cur) => acc + String.fromCharCode(cur), ''));
      return APNG_base64;
    } catch(e) {
      addToast("转换失败", { appearance: 'error' });
      throw e;
    }
  };

  const readImageTypeAndBase64 = async (dataurl) => {
    const imageType = dataurl.split(',')[0].split(';')[0].split(':')[1];
    const base64 = dataurl.substr(dataurl.indexOf("base64,") + "base64,".length);
    return { imageType, image: base64 };
  }

  const onSendV2 = async (token, text, image) => {
    const payload = {
      user_token: token,
      type: "image",
      text,
      data: image,
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
    if (json.code === 0) {
      addToast("发送成功", { appearance: "success" });
    } else if (json.code === 1 && json.msg.indexOf("登录") !== -1) {
      addToast("无效的 Token", { appearance: "warning" });
    } else if (json.code === 1 && json.msg === "Invalid image format") {
      addToast("无效的图片", { appearance: "warning" });
    } else if (json.code === 1 && json.msg.indexOf("server") !== -1) {
      addToast("未知错误，请尝试减少图片大小", { appearance: "warning" });
    } else {
      addToast("未知错误", { appearance: "error" });
    }
  };

  const onSubmit = async value => {
    event.preventDefault();
    if (filesContent.length === 0) {
      addToast("请添加图片", { appearance: 'error' });
      return;
    }
    const token = event.target.token.value;
    const text = event.target.text.value;
    setBtnDisabled(true);
    try {
      if (previewAPNG) {
        const { imageType, image } = await readImageTypeAndBase64(previewAPNG);
        await onSendV2(token, text, image);
      } else {
        const { imageType, image } = await readImageTypeAndBase64(filesContent[0].content);
        if (imageType !== "image/gif") {
          await onSendV2(token, text, image);
        } else {
          addToast("检测到 GIF 图片，转换中...", { appearance: 'info', autoDismissTimeout: 15000 });
          const APNG_base64 = await convertGIFtoAPNG(image);
          const APNG_url = `data:image/png;base64,${APNG_base64}`;
          setPreviewAPNG(APNG_url);
          addToast("转换完成，再次点击发送按钮后发送", { appearance: 'success' });
        }
      }
    } catch(e) {
      console.error(e);
    }
    setBtnDisabled(false);
  };

  return (
    <MDBRow className="justify-content-center">
      <MDBCol lg="7" md="9" style={{ marginTop: "100px" }}>
        <form onSubmit={onSubmit}>
          <MDBInput required id="token" label="PKUHelper Token" type="password" />
          <MDBInput className="mt-2" id="text" label="Text" rows="5" textarea style={{
            minHeight: "4rem"
          }} />
          <MDBRow className="mt-3">
          {
            filesContent.length === 0 ? (
              <MDBTypography note noteColor='warning'>
                <strong>请选择图片</strong>
              </MDBTypography>
            ) :
              filesContent.map((file, index) => (
                <MDBCol key={index}>
                  <figure style={{
                    display: 'inline-block',
                  }}>
                    <img
                      src={file.content} alt={file.name}
                      className='img-thumbnail'
                      style={{ maxWidth: '24rem' }}
                    />
                    <figcaption style={{
                      textAlign: 'center',
                    }}>预览</figcaption>
                  </figure>
                </MDBCol>
              ))
          }
          {
            previewAPNG ? (
              <MDBCol>
                <figure style={{
                  display: 'inline-block',
                }}>
                  <img
                    src={previewAPNG} alt="preview"
                    className='img-thumbnail'
                    style={{ maxWidth: '24rem' }}
                  />
                  <figcaption style={{
                    textAlign: 'center',
                  }}>预览（转换后）</figcaption>
                </figure>
              </MDBCol>
            ) : null
          }
          </MDBRow>
          <MDBRow className="mt-3">
            <MDBCol>
              <MDBBtn disabled={ btnDisabled } color='primary' block outline type="submit">发送</MDBBtn>
            </MDBCol>
            <MDBCol>
              <MDBBtn color='secondary' block outline role="button" onClick={(event) => {
                event.preventDefault();
                setPreviewAPNG(null);
                openFileSelector();
              }}>选择图片</MDBBtn>
            </MDBCol>
          </MDBRow>
        </form>
      </MDBCol>
    </MDBRow>
  )
}

export default function Home() {
  const [data, setData] = useState(null);
  const [userAgent, setUserAgent] = useState("");
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    setUserAgent(navigator.userAgent);
    setLoading(true);
    fetch('/bookmarklet.js')
      .then((res) => res.text())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [])
  return (
    <>
      <Head>
        <title>PKUHole GIF Sender</title>
      </Head>
      <MDBContainer>
        <ToastProvider autoDismiss>
          <Form/>
        </ToastProvider>
        <MDBRow className="mt-5 justify-content-center">
          <MDBCol lg="7" md="9">
            <hr />
            <MDBTypography note noteColor='info'>
              <p><strong>Q: 这是什么工具？</strong></p>
              <p>A: 此工具可以转发未压缩的图片到 P大树洞<MDBTypography tag='del'>，曾可以实现发送 GIF 的功能</MDBTypography>，可以实现发送动图的功能。</p>
              <p><strong>Q: 我的 TOKEN 会被此工具的开发者窃取吗？</strong></p>
              <p>A: 项目部署在 <a href="https://vercel.com">Vercel</a> 上且代码<a href="/_src">开源</a>，开发者不会也没有能力窃取上传的 TOKEN 。此项目为纯前端工具，请求直接发送到 PKUHelper 服务器，不存在泄露风险。</p>
            </MDBTypography>
            <hr />
            <div>
              <MDBTypography note noteColor='danger'>
                <p>此工具发送到树洞的图片为原图，可能包含 EXIF 信息，这可能泄露您拍摄时的位置信息、手机型号、镜头信息等。</p>
                <p>建议使用本工具后立即重置 TOKEN 。</p>
                <p>使用此工具所导致的任何后果由使用者承担。</p>
              </MDBTypography>
            </div>
          </MDBCol>
        </MDBRow>
        <MDBFooter bgColor='white' className='text-center text-lg-left'>
          <div className='text-center p-3'>
            <p>
              <hr/>
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Powered by{' '}
                <img src="/vercel.svg" alt="Vercel Logo" className="logo" style={{
                  height: "1rem",
                }} />
              </a>
              &ensp;&ensp;|&ensp;&ensp;
              <a
                href="/_src"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Source
              </a>
            </p>
          </div>
        </MDBFooter>
      </MDBContainer>
      <Script src="/unpkg/@ffmpeg/ffmpeg@0.10.0/dist/ffmpeg.min.js"></Script>
    </>
  )
}