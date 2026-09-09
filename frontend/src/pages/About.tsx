import React, { useState } from 'react';
import { Mail, Github, Video, MessageCircle, UserRound, FileText, ArrowUpRight } from 'lucide-react';
import AboutFileExplorer from '../components/AboutFileExplorer';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { normalizeExternalUrl } from '../lib/externalUrl';
import './About.css';

const About: React.FC = () => {
  const config = useSiteConfig();
  const [copyStatus, setCopyStatus] = useState('');
  const [copying, setCopying] = useState(false);
  const copyContact = async (value: string, label: string) => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(label + '已复制。');
    } catch {
      setCopyStatus('复制未成功，请手动选择并复制：' + value);
    } finally { setCopying(false); }
  };
  const socials = [
    { name: 'GitHub', value: config.github, icon: Github },
    { name: '哔哩哔哩', value: config.bilibili, icon: Video },
    { name: 'Twitter / X', value: config.twitter, icon: ArrowUpRight },
  ].map(item => ({ ...item, url: normalizeExternalUrl(item.value) })).filter(item => item.url);

  return <div className="about-journal">
    <section className="about-welcome about-panel">
      <span className="about-eyebrow"><UserRound size={18} /> 欢迎来访</span>
      <h1>你好，我是 <mark>{config.authorName}</mark>。</h1>
      <p className="about-intro">{config.authorBio || config.siteDescription}</p>
      <div className="about-hand-note">这里是 {config.blogName}，欢迎慢慢逛。</div>
    </section>
    <section className="about-files about-panel" aria-labelledby="about-files-heading">
      <header className="about-section-heading"><FileText size={20} /><h2 id="about-files-heading">相关文件</h2></header>
      <p className="about-section-copy">分享在这里的文档与附件，可以在线阅读或下载。加锁文件需要访问密码。</p>
      <AboutFileExplorer />
    </section>
    <section className="about-contact about-panel" aria-labelledby="about-contact-heading">
      <header className="about-section-heading"><Mail size={20} /><h2 id="about-contact-heading">{config.pageCopy.aboutContactTitle}</h2></header>
      <div className="about-contact-grid">
        {config.email && <button type="button" disabled={copying} onClick={() => void copyContact(config.email, '邮箱')}><Mail size={21} /><span><small>邮箱 · 点击复制</small><strong>{config.email}</strong></span></button>}
        {socials.map(({ name, value, url, icon: Icon }) => <a href={url!} key={name} target="_blank" rel="noopener noreferrer"><Icon size={21} /><span><small>{name}</small><strong>{value}</strong></span><ArrowUpRight size={15} /></a>)}
        {config.wechat && <button type="button" disabled={copying} onClick={() => void copyContact(config.wechat, '微信号')}><MessageCircle size={21} /><span><small>微信 · 点击复制</small><strong>{config.wechat}</strong></span></button>}
      </div>
      <p className="about-contact-status" role="status">{copyStatus || config.pageCopy.aboutContactCopyTip}</p>
    </section>
  </div>;
};

export default About;
