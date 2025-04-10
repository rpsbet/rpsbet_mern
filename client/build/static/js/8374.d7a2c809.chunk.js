"use strict";(self.webpackChunkclient=self.webpackChunkclient||[]).push([[4636,8374],{4636:(e,r,t)=>{t.r(r),t.d(r,{default:()=>L});var n=t(65043),s=t(1529),i=(t(10844),t(92127)),o=t(12639),a=t(7353),l=t(42518),c=t(688),d=t(32143),x=t(78185),u=t(94496),p=t(79650),h=t(71806),f=t(73460),m=t(28076),j=t(10039),g=t(59135),A=t(31973),y=t(22166),b=t(28104),v=t(74458),w=t(95575),C=t(60916),S=t(57498),k=t(29777),I=t(42281),_=t(39412),R=t(83034),O=t(70579);const N=s.Ay.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  width: 100%;
`,M=s.Ay.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`,T=s.Ay.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  margin: 20px 0;
  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: repeat(1, 1fr);
  }
`,E=s.Ay.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`,P=s.Ay.div`
  background-color: #2e2e2e;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  height: 320px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.03);
  }
`,D=(s.Ay.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #28a745;
  color: #fff;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
`,s.Ay.div`
  display: flex;
  justify-content: center;
`,()=>{const e=(0,y.wA)(),r=(0,R.T)((0,y.d4)((e=>e.auth.isDarkMode))?"dark":"light"),t=(0,y.d4)((e=>e.itemReducer.itemArray)),s=(0,y.d4)((e=>e.itemReducer.pages)),D=(0,y.d4)((e=>e.itemReducer.page)),L=(0,y.d4)((e=>e.itemReducer.loading)),U=(0,y.d4)((e=>e.auth.isDarkMode)),z=(0,y.d4)((e=>e.auth.user)),F=(0,y.d4)((e=>e.logic.solPrice)),Y=(0,y.d4)((e=>e.auth.isLowGraphics)),[B,W]=(0,n.useState)({}),[G,H]=(0,n.useState)(!1),[X,J]=(0,n.useState)(""),[$,q]=(0,n.useState)(null),[Q,K]=(0,n.useState)(null),[V,Z]=(0,n.useState)("updated_at"),[ee,re]=(0,n.useState)("653ee81117c9f5ee2124564b"),te=(0,n.useRef)(JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]));(0,n.useEffect)((()=>{const e=te.current,r=JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]);e!==r&&(ne(),te.current=r)})),(0,n.useEffect)((()=>{ne()}),[]),(0,n.useEffect)((()=>{t&&t.length>0&&se()}),[t,e]);const ne=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:V,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:ee;e((0,b.Se)(100,D,r,t))},se=async()=>{if(t)for(const n of t)if(n.owners&&n.owners.length>0)for(const t of n.owners)if(!B[t.user])try{const r=await e((0,v.Jx)(t.user));W((e=>({...e,[t.user]:r||{username:"Anon",avatar:"default-avatar-url"}})))}catch(r){console.error(`Error fetching customer info for ${t.user}:`,r)}},ie=e=>{q(null),e&&(re(e),ne(V,e))},oe=e=>{K(null),e&&(Z(e),ne(e,ee))},ae=t?[...t].sort(((e,r)=>{const t=e[V],n=r[V];return"asc"===V?t-n:n-t})):[];return(0,O.jsxs)(_.A,{theme:r,children:[(0,O.jsx)(a.A,{sx:{background:"#080808",borderRadius:"0.3em",p:"20px"},children:(0,O.jsxs)(N,{children:[(0,O.jsxs)(M,{children:[(0,O.jsxs)("div",{className:"filters",children:[(0,O.jsxs)(l.A,{color:"error",variant:"outlined",onClick:e=>q(e.currentTarget),children:["Filter\xa0",(0,O.jsx)(i.g,{icon:o.mRM})]}),(0,O.jsx)(c.A,{anchorEl:$,open:Boolean($),onClose:()=>ie(null),children:(0,O.jsx)(d.A,{onClick:()=>ie("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===ee,children:"Accessories"})})]}),(0,O.jsxs)("div",{className:"filters",children:[(0,O.jsxs)(l.A,{color:"error",variant:"outlined",onClick:e=>K(e.currentTarget),children:["Sort By\xa0",(0,O.jsx)(i.g,{icon:o.OM7})]}),(0,O.jsxs)(c.A,{anchorEl:Q,open:Boolean(Q),onClose:()=>oe(null),children:[(0,O.jsx)(d.A,{onClick:()=>oe("updated_at"),selected:"updated_at"===V,children:"Sort by CP"}),(0,O.jsx)(d.A,{onClick:()=>oe("price"),selected:"price"===V,children:"Sort by Price"})]})]})]}),L?(0,O.jsx)(a.A,{sx:{textAlign:"center",fontStyle:"italic",color:"text.secondary"},children:"No Loans Found"}):(0,O.jsxs)(T,{children:[G&&(0,O.jsx)(S.default,{selectedCreator:X,modalIsOpen:G,closeModal:()=>H(!1)}),ae.map((r=>{var t;if(null===(t=r.owners)||void 0===t||!t.length)return null;const n=r.owners[0];"FRACTIONAL"===r.loan_type?r.fractional_amount:r.loan_amount;return(0,O.jsxs)(P,{onClick:()=>{e((0,b.ce)(r._id)),e((0,b.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price}))},children:[(0,O.jsxs)(a.A,{sx:{position:"relative",flex:1,display:"flex",alignItems:"center",justifyContent:"center"},children:[r.owners.map((e=>(0,O.jsx)(a.A,{sx:{position:"absolute",top:8,left:8},children:B[e.user]?(0,O.jsx)(a.A,{component:"a",onClick:r=>{r.stopPropagation(),r.preventDefault(),J(B[e.user]._id),H(!0)},className:"player",children:(0,O.jsx)(C.A,{user_id:B[e.user]._id,src:B[e.user].avatar,rank:B[e.user].totalWagered,accessory:B[e.user].accessory,alt:"",username:B[e.user].username,darkMode:U})}):(0,O.jsx)(x.A,{variant:"circular",width:40,height:40})},e.user))),r.image&&(0,I._)(r.image,Y)?(0,O.jsx)(a.A,{sx:{width:80,height:80},children:(0,I._)(r.image,Y)}):(0,O.jsx)(a.A,{component:"img",src:r.image,alt:r.productName,sx:{maxWidth:80,maxHeight:80,borderRadius:2}})]}),(0,O.jsxs)(a.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,O.jsxs)(a.A,{children:[(0,O.jsx)(u.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,O.jsx)(p.A,{children:(0,O.jsx)(h.A,{size:"small","aria-label":"loan-details-table",children:(0,O.jsxs)(f.A,{children:[(0,O.jsxs)(m.A,{children:[(0,O.jsxs)(j.A,{sx:{color:"#bbb"},children:[(0,O.jsx)(i.g,{icon:o._2z})," ",n.rentOption?"Price / month":"Price / unit",":"]}),(0,O.jsx)(j.A,{sx:{color:"#ff8500"},children:(0,k.a)(n.price,F)})]}),(0,O.jsxs)(m.A,{children:[(0,O.jsxs)(j.A,{sx:{color:"#bbb"},children:[(0,O.jsx)(i.g,{icon:o.kwR})," Quantity:"]}),(0,O.jsxs)(j.A,{sx:{color:"#ff8500"},children:[n.onSale," / ",r.total_count]})]})]})})})]}),(0,O.jsx)(a.A,{sx:{textAlign:"right",mt:1},children:(0,O.jsx)(Tooltip,{title:n.rentOption?"Rent":"Trade",children:(0,O.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,O.jsx)(A.A,{}),onClick:t=>{if(t.stopPropagation(),e((0,b.ce)(r._id)),e((0,b.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price})),n.user!==z)if(r.showConfirmationModal){const t=window.confirm(r.message);e(t?(0,w.Gu)(n.rentOption?"rent":"trade"):(0,w.NX)("TRADE ACTION CANCELLED,PUSSY-ED OUT"))}else e((0,w.Gu)(n.rentOption?"rent":"trade"));else e((0,w.NX)("THIS IS LITERALLY YOURS ALREADY!"))},children:n.rentOption?"Rent":"Trade"})})})]})]},`${r._id}-${n.user}`)}))]}),!L&&(0,O.jsx)(E,{children:(0,O.jsx)(g.A,{page:D,count:s,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,b.Se)(100,t,V,ee))}})})]})}),G&&(0,O.jsx)(S.default,{selectedCreator:X,modalIsOpen:G,closeModal:()=>H(!1)})]})}),L=()=>(0,O.jsx)(D,{})},82462:(e,r,t)=>{t.r(r),t.d(r,{default:()=>j});var n=t(65043),s=t(22166),i=t(53062),o=t(7353),a=t(94496),l=t(42518),c=t(39412),d=t(92127),x=t(12639),u=t(67957),p=t(4636),h=t(83337),f=t(83034),m=t(70579);const j=function(e){let{modalIsOpen:r,closeModal:t}=e;const j=(0,s.d4)((e=>e.auth.isDarkMode)),[g,A]=(0,n.useState)(!1),[y]=(0,n.useState)("updated_at"),[b]=(0,n.useState)("653ee81117c9f5ee2124564b"),v=(0,f.T)(j?"dark":"light");return(0,m.jsxs)(c.A,{theme:v,children:[(0,m.jsx)(i.A,{open:r||!1,onClose:t,closeAfterTransition:!0,BackdropProps:{style:{backgroundColor:"rgba(0, 0, 0, 0.8)"}},sx:{zIndex:1300},children:(0,m.jsxs)(o.A,{sx:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",bgcolor:"#1c1c1c",color:"#fff",boxShadow:24,p:3,borderRadius:1,width:"90%",maxWidth:800,maxHeight:"90vh",overflowY:"auto"},children:[(0,m.jsxs)(o.A,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2},children:[(0,m.jsxs)(a.A,{variant:"h6",sx:{display:"flex",alignItems:"center",gap:1},children:[(0,m.jsx)(d.g,{icon:x.ITF}),"MARKETPLACE"]}),(0,m.jsx)(l.A,{variant:"text",color:"error",onClick:t,sx:{fontSize:"1.25rem"},children:"\xd7"})]}),(0,m.jsx)(o.A,{sx:{mb:2},children:(0,m.jsx)(p.default,{itemType:b,sortCriteria:y})}),(0,m.jsx)(o.A,{sx:{display:"flex",justifyContent:"flex-end"},children:(0,m.jsx)(l.A,{variant:"contained",color:"error",onClick:()=>A(!0),startIcon:(0,m.jsx)(u.A,{}),children:"List Item For Sale"})})]})}),g&&(0,m.jsx)(h.default,{modalIsOpen:g,closeModal:()=>A(!1)})]})}},83337:(e,r,t)=>{t.r(r),t.d(r,{default:()=>W});var n=t(65043),s=t(22166),i=t(53062),o=t(7353),a=t(94496),l=t(42518),c=t(67957),d=t(92127),x=t(12639),u=t(1529),p=t(39412),h=t(688),f=t(32143),m=t(78185),j=t(79650),g=t(71806),A=t(73460),y=t(28076),b=t(10039),v=t(18483),w=t(59135),C=t(59662),S=t(70579);const k=(0,C.A)((0,S.jsx)("path",{d:"M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12z"}),"Cancel");var I=t(31973),_=t(28104),R=t(84375),O=t(95575),N=t(74458),M=t(57498),T=t(29777),E=t(42281),P=t(83034);const D=u.Ay.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`,L=u.Ay.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`,U=u.Ay.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  width: 100%;
  margin: 20px 0;

  @media (min-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`,z=u.Ay.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;u.Ay.div`
  background-color: #2e2e2e;
  border-radius: 8px;
  height: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.03);
  }
`;const F=function(){const e=(0,s.wA)(),{data:r,pages:t,page:i,loading:c,accessory:u,isDarkMode:C,userInfo:F,isLowGraphics:Y}=(0,s.d4)((e=>({data:e.itemReducer.myItemArray,pages:e.itemReducer.pages,page:e.itemReducer.page,loading:e.itemReducer.loading,accessory:e.itemReducer.accessory,isDarkMode:e.auth.isDarkMode,userInfo:e.auth.user,isLowGraphics:e.auth.isLowGraphics}))),[B,W]=(0,n.useState)({}),[G,H]=(0,n.useState)(!1),[X,J]=(0,n.useState)(""),[$,q]=(0,n.useState)(null),[Q,K]=(0,n.useState)("updated_at"),[V,Z]=(0,n.useState)("653ee81117c9f5ee2124564b"),ee=(0,n.useRef)(),re=(0,P.T)(C?"dark":"light");(0,n.useEffect)((()=>{null!==F&&void 0!==F&&F._id&&(e((0,R.X4)(F._id)),e((0,_.g0)(100,i,Q,V)))}),[e,null===F||void 0===F?void 0:F._id,i,Q,V]),(0,n.useEffect)((()=>{const t=ee.current,n=JSON.stringify((null===r||void 0===r?void 0:r.owners)||[]);t&&t!==n&&e((0,_.g0)(100,i,Q,V)),ee.current=n}),[r,e,i,Q,V]),(0,n.useEffect)((()=>{ne()}),[r]);const te=async()=>{await e((0,_.g0)(100,i,Q,V))},ne=async()=>{if(r)for(const n of r)if(n.owners&&n.owners.length>0)for(const r of n.owners)if(!B[r.user])try{const t=await e((0,N.Jx)(r.user));W((e=>({...e,[r.user]:t.payload||{username:"Anon",avatar:"default-avatar-url"}})))}catch(t){console.error(`Error fetching customer info for ${r.user}:`,t)}},se=e=>{q(null),e&&(Z(e),te())},ie=async(r,t)=>{var n;const s=await e((0,R.Ci)({item_id:r}));null!==(n=s.payload)&&void 0!==n&&n.success?(e((0,R.X4)(F._id)),te(),e((0,O.NX)(s.payload.message,"-cat"))):e((0,O.NX)("Unable to Equip item. De-List item first."))};return(0,S.jsx)(p.A,{theme:re,children:(0,S.jsx)(o.A,{sx:{background:"#080808",borderRadius:"0.3em",p:"20px"},children:(0,S.jsxs)(D,{children:[(0,S.jsx)(L,{children:(0,S.jsxs)("div",{className:"filters",children:[(0,S.jsxs)(l.A,{color:"error",variant:"outlined",onClick:e=>q(e.currentTarget),children:["Filter ",(0,S.jsx)(d.g,{icon:x.mRM})]}),(0,S.jsx)(h.A,{anchorEl:$,open:Boolean($),onClose:()=>se(null),children:(0,S.jsx)(f.A,{onClick:()=>se("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===V,children:"Accessory"})})]})}),c?(0,S.jsx)(o.A,{sx:{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center",mt:2},children:Array.from(new Array(6)).map(((e,r)=>(0,S.jsxs)(o.A,{children:[(0,S.jsx)(m.A,{variant:"rectangular",width:165,height:160,sx:{mb:1}}),(0,S.jsx)(m.A,{variant:"text",width:120}),(0,S.jsx)(m.A,{variant:"text",width:100})]},r)))}):(0,S.jsx)(U,{children:null===r||void 0===r?void 0:r.map((r=>(0,S.jsxs)(o.A,{sx:{backgroundColor:"#2e2e2e",borderRadius:2,height:320,display:"flex",flexDirection:"column",overflow:"hidden",cursor:"pointer",transition:"transform 0.2s","&:hover":{transform:"scale(1.03)"}},onClick:()=>{e((0,_.ce)(r._id)),e((0,_.dd)({item_type:r.item_type,productName:r.productName,rentOption:r.rentOption,price:r.price,onSale:r.onSale}))},children:[(0,S.jsx)(o.A,{sx:{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"},children:r.image&&(0,E._)(r.image,Y)?(0,S.jsx)(o.A,{sx:{width:80,height:80},children:(0,E._)(r.image,Y)}):(0,S.jsx)(o.A,{component:"img",src:r.image,alt:r.productName,sx:{maxWidth:80,maxHeight:80,borderRadius:2}})}),(0,S.jsxs)(o.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,S.jsxs)(o.A,{children:[(0,S.jsx)(a.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,S.jsx)(j.A,{children:(0,S.jsx)(g.A,{className:"product-detail",children:(0,S.jsxs)(A.A,{children:[r.rentOption&&0===r.onSale?(0,S.jsxs)(y.A,{children:[(0,S.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,S.jsx)(d.g,{icon:x._2z})," Cost Per Month:"]}),(0,S.jsx)(b.A,{sx:{color:"#ff8500"},children:(0,T.a)(r.price)})]}):(0,S.jsxs)(y.A,{children:[(0,S.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,S.jsx)(d.g,{icon:x._2z})," ",r.rentOption?"Price Per Month:":"Price Per Unit:"]}),(0,S.jsx)(b.A,{sx:{color:"#ff8500"},children:(0,T.a)(r.price)})]}),r.rentOption&&0===r.onSale?null:(0,S.jsxs)(y.A,{children:[(0,S.jsx)(b.A,{sx:{color:"#bbb"},children:r.rentOption?"Renting Out:":"On Sale:"}),(0,S.jsx)(b.A,{sx:{color:"#ff8500"},children:r.onSale})]}),(0,S.jsxs)(y.A,{children:[(0,S.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,S.jsx)(d.g,{icon:x.kwR})," Total:"]}),(0,S.jsx)(b.A,{sx:{color:"#ff8500"},children:r.total_count})]}),(0,S.jsxs)(y.A,{children:[(0,S.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,S.jsx)(d.g,{icon:x.R70})," Type:"]}),(0,S.jsx)(b.A,{sx:{color:"#ff8500"},children:"Accessory"})]})]})})})]}),(0,S.jsxs)(o.A,{sx:{display:"flex",gap:1,justifyContent:"flex-end",mt:1},children:[0===r.onSale&&r.rentOption?(0,S.jsx)(v.A,{title:"Discontinue Renting",children:(0,S.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,S.jsx)(k,{}),onClick:t=>{var n;t.stopPropagation(),n=r._id,e((0,_.ce)(n)),e((0,_.eU)(n))},children:"RETURN"})}):(0,S.jsxs)(S.Fragment,{children:[r.onSale!==r.total_count&&(0,S.jsx)(v.A,{title:"List Item",children:(0,S.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,S.jsx)(I.A,{}),onClick:t=>{t.stopPropagation(),(r=>{e((0,_.ce)(r._id)),e((0,_.dd)({item_type:r.item_type,productName:r.productName,rentOption:r.rentOption,price:r.price,onSale:r.onSale})),e((0,O.Fr)())})(r)},children:"LIST"})}),r.onSale>0&&(0,S.jsx)(v.A,{title:"De-List Item",children:(0,S.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,S.jsx)(I.A,{}),onClick:t=>{t.stopPropagation(),(r=>{e((0,_.ce)(r._id)),e((0,O.a1)())})(r)},children:"DE-LIST"})})]}),"653ee81117c9f5ee2124564b"===r.item_type&&0===r.onSale&&(0,S.jsx)(v.A,{title:u&&u===r.image?"Unequip Item":"Equip Item",children:(0,S.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,S.jsx)(I.A,{}),onClick:e=>{e.stopPropagation(),ie(r._id,r.image)},children:u&&u===r.image?"UNEQUIP":"EQUIP"})})]})]})]},r._id)))}),!c&&(0,S.jsx)(z,{children:(0,S.jsx)(w.A,{page:i,count:t,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,_.g0)(100,t,Q,V))}})}),G&&(0,S.jsx)(M.default,{selectedCreator:X,modalIsOpen:G,closeModal:()=>H(!1)})]})})})};const Y=function(){return(0,S.jsx)(F,{})};var B=t(82462);const W=function(e){let{modalIsOpen:r,closeModal:t}=e;const u=(0,s.d4)((e=>e.auth.isDarkMode)),p=(0,s.d4)((e=>e.logic.solPrice)),[h,f]=(0,n.useState)(!1);return(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(i.A,{open:r||!1,onClose:t,closeAfterTransition:!0,sx:{zIndex:1300},BackdropProps:{style:{backgroundColor:"rgba(0, 0, 0, 0.8)"}},children:(0,S.jsxs)(o.A,{sx:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",bgcolor:"#1c1c1c",color:"#fff",boxShadow:24,borderRadius:1,p:3,width:600,maxWidth:"90vw",maxHeight:"90vh",overflowY:"auto"},children:[(0,S.jsxs)(o.A,{sx:{display:"flex",justifyContent:"space-between",mb:2},children:[(0,S.jsxs)(a.A,{variant:"h6",sx:{display:"flex",alignItems:"center",fontWeight:"bold"},children:[(0,S.jsx)(d.g,{icon:x.THi,style:{marginRight:8}}),"INVENTORY"]}),(0,S.jsx)(l.A,{variant:"text",color:"error",onClick:t,children:"\xd7"})]}),(0,S.jsx)(Y,{solPrice:p}),(0,S.jsx)(o.A,{sx:{display:"flex",justifyContent:"flex-end",gap:2},children:(0,S.jsx)(l.A,{variant:"contained",color:"error",onClick:()=>f(!0),startIcon:(0,S.jsx)(c.A,{}),children:"BUY More"})})]})}),h&&(0,S.jsx)(B.default,{modalIsOpen:h,closeModal:()=>f(!1),isDarkMode:u})]})}}}]);
//# sourceMappingURL=8374.d7a2c809.chunk.js.map