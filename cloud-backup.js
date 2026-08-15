(function(){
  'use strict';

  const FORMAT='as9-cloud-backup';
  const VERSION=1;
  const DAY=24*60*60*1000;

  const byteSize=value=>new Blob([typeof value==='string'?value:JSON.stringify(value)]).size;
  const fmt=bytes=>bytes>=1024*1024?`${(bytes/1024/1024).toFixed(1)}MB`:`${Math.max(1,Math.round(bytes/1024))}KB`;
  const safeName=value=>String(value||'現場データ').replace(/[\\/:*?"<>|]/g,'_').replace(/\s+/g,'_').slice(0,60);
  const stamp=()=>{const d=new Date();return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;};

  function injectStyle(){
    if(document.getElementById('cloud-backup-style'))return;
    const style=document.createElement('style');style.id='cloud-backup-style';
    style.textContent=`
      .cloud-backup-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:42px;padding:9px 13px;border:1px solid #b8c6d8;border-radius:9px;background:#fff;color:#1a4a7a;font:inherit;font-size:13px;font-weight:700;white-space:nowrap;cursor:pointer;box-shadow:0 1px 2px rgba(20,40,70,.05)}
      .cloud-backup-btn.restore{color:#445466;background:#f8fafc}
      .cloud-backup-status{display:none;margin:8px 12px;padding:10px 13px;border:1px solid #b7cbe0;border-radius:9px;background:#eef5fc;color:#234d75;font-size:12px;line-height:1.55}
      .cloud-backup-status.show{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .cloud-backup-status.warn{border-color:#e5c271;background:#fff7df;color:#7b5400}
      .cloud-backup-status.danger{border-color:#e1a1a1;background:#fff0f0;color:#922b2b}
      .cloud-backup-status strong{font-weight:800}
      @media(max-width:560px){.cloud-backup-btn{padding:9px 11px;font-size:12px}.cloud-backup-status{margin:7px 8px}}
    `;
    document.head.appendChild(style);
  }

  class BackupController{
    constructor(config){this.config=config;this.lastKey=`cloud_backup_last_${config.appId}`;this.refreshTimer=null;}
    async mount(){
      injectStyle();
      const mount=document.querySelector(this.config.mountSelector);
      if(!mount)throw new Error(`バックアップボタンの配置先が見つかりません: ${this.config.mountSelector}`);
      const backup=document.createElement('button');backup.type='button';backup.className='cloud-backup-btn';backup.textContent='☁ バックアップ';backup.onclick=()=>this.backup();
      const restore=document.createElement('button');restore.type='button';restore.className='cloud-backup-btn restore';restore.textContent='📥 復元';restore.onclick=()=>this.input.click();
      mount.append(backup,restore);
      this.input=document.createElement('input');this.input.type='file';this.input.accept='.json,application/json';this.input.hidden=true;this.input.onchange=e=>this.restoreFile(e.target.files&&e.target.files[0]);document.body.appendChild(this.input);
      this.status=document.createElement('div');this.status.className='cloud-backup-status';
      const statusParent=document.querySelector(this.config.statusAfterSelector||this.config.mountSelector)||mount;
      statusParent.insertAdjacentElement('afterend',this.status);
      await this.refresh();
      this.refreshTimer=setInterval(()=>this.refresh(),60000);
    }
    async snapshot(){return await this.config.collect();}
    hasData(data){return this.config.hasData?!!this.config.hasData(data):byteSize(data)>200;}
    async refresh(){
      try{
        const data=await this.snapshot(),bytes=byteSize(data),max=this.config.maxBytes||5*1024*1024,ratio=bytes/max;
        const last=Number(localStorage.getItem(this.lastKey)||0),age=last?Date.now()-last:Infinity,hasData=this.hasData(data);
        this.status.className='cloud-backup-status';
        if(!hasData){this.status.textContent='';return;}
        let cls='',message='';
        if(ratio>=.8){cls='danger';message=`保存容量が危険な状態です（約 ${fmt(bytes)}）。写真追加の前にバックアップしてください。`;}
        else if(ratio>=.6){cls='warn';message=`保存容量が増えています（約 ${fmt(bytes)}）。早めのバックアップをおすすめします。`;}
        else if(!last){cls='warn';message=`クラウド用バックアップがまだありません（約 ${fmt(bytes)}）。`;}
        else if(age>=7*DAY){cls='warn';message=`最後のバックアップから${Math.floor(age/DAY)}日経過しています（約 ${fmt(bytes)}）。`;}
        else{message=`最終バックアップ：${new Date(last).toLocaleString('ja-JP',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})} ・ データ約 ${fmt(bytes)}`;}
        this.status.classList.add('show');if(cls)this.status.classList.add(cls);
        this.status.innerHTML=`<strong>☁ ${message}</strong>`;
      }catch(e){console.warn('backup status',e);}
    }
    async backup(){
      try{
        const data=await this.snapshot();
        if(!this.hasData(data)&&!confirm('入力データがほとんどありません。この状態でバックアップしますか？'))return;
        const payload={format:FORMAT,version:VERSION,appId:this.config.appId,appName:this.config.appName,exportedAt:new Date().toISOString(),data};
        const json=JSON.stringify(payload),namePart=this.config.fileName?this.config.fileName(data):this.config.appName;
        const file=new File([json],`${safeName(namePart)}_バックアップ_${stamp()}.json`,{type:'application/json'});
        let completed=false;
        if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
          try{await navigator.share({title:`${this.config.appName} バックアップ`,text:'再編集用の完全バックアップです。Google DriveやOneDriveなどへ保存してください。',files:[file]});completed=true;}
          catch(e){if(e.name==='AbortError')return;}
        }
        if(!completed){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);completed=true;alert('バックアップファイルをダウンロードしました。Google DriveやOneDriveへ保存してください。');}
        if(completed){try{localStorage.setItem(this.lastKey,String(Date.now()));}catch(_){}try{await navigator.storage?.persist?.();}catch(_){}await this.refresh();}
      }catch(e){alert(`バックアップを作成できませんでした。${e&&e.message?'\n'+e.message:''}`);}
    }
    async restoreFile(file){
      if(!file)return;
      try{
        const payload=JSON.parse(await file.text());
        if(payload.format!==FORMAT||payload.appId!==this.config.appId)throw new Error(`${this.config.appName}用のバックアップファイルではありません。`);
        if(!confirm('現在の保存データを、選択したバックアップの内容に置き換えます。よろしいですか？'))return;
        await this.config.restore(payload.data);
        try{localStorage.setItem(this.lastKey,String(Date.now()));}catch(_){}
        alert('バックアップを復元しました。');
        await this.refresh();
      }catch(e){alert(`復元できませんでした。${e&&e.message?'\n'+e.message:''}`);}
      finally{this.input.value='';}
    }
  }

  window.CloudBackup={
    async mount(config){const controller=new BackupController(config);await controller.mount();return controller;}
  };
})();
