import Head from 'next/head';
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
  const [openFileSelector, { filesContent }] = useFilePicker({
    accept: 'image/*',
    readAs: 'DataURL',
    multiple: false,
  });
  const { addToast } = useToasts();

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
    let url = new URL("/api/pkuhole", window.location.href);
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
    const dataurl = filesContent[0].content;
    const image = dataurl.substr(dataurl.indexOf("base64,") + "base64,".length);
    const token = event.target.token.value;
    const text = event.target.text.value;
    setBtnDisabled(true);
    try {
      await onSendV2(token, text, image);
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
          <div className="mt-3">
          {
            filesContent.length === 0 ? (
              <MDBTypography note noteColor='warning'>
                <strong>请选择图片</strong>
              </MDBTypography>
            ) :
              filesContent.map((file, index) => (
                <div key={index}>
                  <img
                    src={file.content} alt={file.name}
                    className='img-thumbnail'
                    style={{ maxWidth: '24rem' }}
                  />
                </div>
              ))
          }
          </div>
          <MDBRow className="mt-3">
            <MDBCol>
              <MDBBtn disabled={ btnDisabled } color='primary' block outline type="submit">发送</MDBBtn>
            </MDBCol>
            <MDBCol>
              <MDBBtn color='secondary' block outline role="button" onClick={(event) => {
                event.preventDefault();
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
              <p>A: 此工具可以转发未压缩的图片到 P大树洞，可以实现发送 GIF 的功能。</p>
              <p><strong>Q: 我的 TOKEN 会被此工具的开发者窃取吗？</strong></p>
              <p>A: 项目部署在 <a href="https://vercel.com">Vercel</a> 上且代码<a href="/_src">开源</a>，开发者不会也没有能力窃取上传的 TOKEN 。</p>
              <p><strong>Q: 我上传的所有数据均不会记录吗？</strong></p>
              <p>A: 所有上传的数据流量均会通过 Vercel ，可以参阅 Vercel 的 <a href="https://vercel.com/legal/privacy-policy">privacy policy</a>。</p>
              <p><strong>Q: 如果我信任 Vercel ，那我的数据一定安全吗？</strong></p>
              <p>
                A: 上传时的 user-agent 可能会被<strong>任何人</strong>查看，您目前的 user-agent 为
                <MDBTypography tag='mark'>{ userAgent }</MDBTypography>，如果您不希望您的 user-agent 被其他人查看，请勿使用本工具。
              </p>
              <p><strong>Q: 如果我不信任 Vercel ，我有其他途径实现类似该工具的效果吗？</strong></p>
              {
                isLoading ? (
                  <p>加载中...</p>
                ) : (
                  <p>
                    A: 如果您使用树洞网页版，您可以将 <a href={ data }>PKUHoleImageSender</a> 拖动至书签栏，切换至树洞网页版标签页后点击该书签。
                  </p>
                )
              }
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
    </>
  )
}