'use strict';

function renderImg(content) {
  return `${hexo.render.renderSync({ text: content, engine: 'markdown' }).split('\n').join('')}`;
}

function buidAlt(alt) {
  if (!!alt && alt !== 'image') {
    return `<span class='image-caption'>${alt}</span>`
  } else {
    return '<span></span>';
  }
}

function buidImgFancybox(content, group) {
  
  var html = renderImg(content).trim();
  if (html.startsWith('<p>') && html.endsWith('</p>')) {  // 去除无用的 p 标签包裹
    html = html.substring(0, html.length - 4).substring(3);
  }

  let imageTags = html.includes('image-caption') ? 'image' : undefined;
  let imgList = html.match(/<img.*?>/g) || [];
  let prom = []
  imgList.forEach(item => {
    prom.push(
      new Promise(function (resolve, reject) {
        const url = (item.match(/\ssrc=['"](.*?)['"]/) || [])[1];
        const alt = (item.match(/\salt=['"](.*?)['"]/) || [])[1];
        const newItem = item.replace('img', 'img fancybox itemprop="contentUrl"');  // 避免出现重复替换，打个标
    
        
        
        // 获取图片宽高比
        const url2 = require('url')
        const http = require('https')
    
        const sizeOf = require('image-size')
    
        const imgUrl = url //图片url
        const options = url2.parse(imgUrl)
        
          
        http.get(options, function (response) {
          const chunks = []
          response.on('data', function (chunk) {
            chunks.push(chunk)
          }).on('end', function () {
            const buffer = Buffer.concat(chunks)
            const dimensions = sizeOf(buffer);
            const h_divide_w = 100 * dimensions.height / dimensions.width;
            const h_divide_w_str = h_divide_w.toString() + '%'; //宽高比
            // 自定义css样式
            const result = `<div class='fancybox' style='position: relative; width: 100%;'>
            <a class='fancybox' pjax-fancybox itemscope itemtype="http://schema.org/ImageObject" itemprop="url" href='${url}' data-fancybox='${group}' data-caption='${alt}' style="position: relative;background-color: rgb(204, 204, 204);border-radius: 4px; padding-bottom: ${h_divide_w_str};color:gray;">
            <div style="position: absolute; left: 50%; top: 50%;transform: translate(-50%, -50%);">loading picture...</div>
            ${newItem}
            </a>${buidAlt(imageTags || alt)}</div>`;
            resolve([item, result])
          })
    
        })
      })
    )
    
    
  })
 return Promise.all(prom).then(res=>{
  res.forEach(r=>{
    let item = r[0]
    let result = r[1]
    html = html.replace(item, result.trim());
  })
  
  return Promise.resolve(html)
})
}


async function postFancybox(args, content) {
  
  if (/::/g.test(args)) {
    args = args.join(' ').split('::');
  }
  else {
    args = args.join(' ').split(',');
  }
  const cls = args[0];
  const col = Number(args[1]) || 0;
  const group = (args[2] || 'default').trim();
  
  if (col > 0) {

    return buidImgFancybox(content, group).then((str)=>{
    return `<div galleryFlag itemscope itemtype="http://schema.org/ImageGallery" class="gallery ${cls}" col='${col}' data-group='${group}'>${str}</div>`;
  })
}
  return buidImgFancybox(content, group).then((str)=>{
  return `<div galleryFlag itemscope itemtype="http://schema.org/ImageGallery" class="gallery ${cls}" data-group='${group}'>${str}</div>`;
})
}



hexo.extend.tag.register('gallery', postFancybox, { ends: true ,async: true});
