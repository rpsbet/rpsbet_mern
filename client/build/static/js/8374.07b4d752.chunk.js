"use strict";(self.webpackChunkclient=self.webpackChunkclient||[]).push([[4636,8374],{4636:(e,r,t)=>{t.r(r),t.d(r,{default:()=>L});var n=t(65043),s=t(1529),o=(t(86178),t(92127)),i=t(12639),a=t(30815),l=t(42518),c=t(688),d=t(32143),x=t(78185),u=t(94496),p=t(79650),f=t(71806),h=t(73460),m=t(28076),j=t(10039),A=t(18483),g=t(59135),y=t(31973),v=t(22166),b=t(28104),w=t(74458),C=t(95575),S=t(60916),k=t(57498),I=t(29777),R=t(6354),O=t(83034),_=t(70579);const N=s.Ay.div`
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
`,E=s.Ay.div`
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
`,P=s.Ay.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`,T=s.Ay.div`
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
`,()=>{const e=(0,v.wA)(),r=(0,O.T)((0,v.d4)((e=>e.auth.isDarkMode))?"dark":"light"),t=(0,v.d4)((e=>e.itemReducer.itemArray)),s=(0,v.d4)((e=>e.itemReducer.pages)),D=(0,v.d4)((e=>e.itemReducer.page)),L=(0,v.d4)((e=>e.itemReducer.loading)),U=(0,v.d4)((e=>e.auth.isDarkMode)),z=(0,v.d4)((e=>e.auth.user)),F=(0,v.d4)((e=>e.logic.solPrice)),[Y,B]=((0,v.d4)((e=>e.auth.isLowGraphics)),(0,n.useState)({})),[G,X]=(0,n.useState)(!1),[J,W]=(0,n.useState)(""),[H,$]=(0,n.useState)(null),[q,Q]=(0,n.useState)(null),[K,V]=(0,n.useState)("updated_at"),[Z,ee]=(0,n.useState)("653ee81117c9f5ee2124564b"),re=(0,n.useRef)(JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]));(0,n.useEffect)((()=>{const e=re.current,r=JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]);e!==r&&(te(),re.current=r)})),(0,n.useEffect)((()=>{te()}),[]),(0,n.useEffect)((()=>{t&&t.length>0&&ne()}),[t,e]);const te=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:K,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:Z;e((0,b.Se)(100,D,r,t))},ne=async()=>{if(t)for(const n of t)if(n.owners&&n.owners.length>0)for(const t of n.owners)if(!Y[t.user])try{const r=await e((0,w.Jx)(t.user));B((e=>({...e,[t.user]:r||{username:"Anon",avatar:"default-avatar-url"}})))}catch(r){console.error(`Error fetching customer info for ${t.user}:`,r)}},se=e=>{$(null),e&&(ee(e),te(K,e))},oe=e=>{Q(null),e&&(V(e),te(e,Z))},ie=t?[...t].sort(((e,r)=>{const t=e[K],n=r[K];return"asc"===K?t-n:n-t})):[];return(0,_.jsxs)(R.A,{theme:r,children:[(0,_.jsx)(a.A,{sx:{background:"#080808",borderRadius:"0.3em",p:"20px"},children:(0,_.jsxs)(N,{children:[(0,_.jsxs)(M,{children:[(0,_.jsxs)("div",{className:"filters",children:[(0,_.jsxs)(l.A,{color:"error",variant:"outlined",onClick:e=>$(e.currentTarget),children:["Filter\xa0",(0,_.jsx)(o.g,{icon:i.mRM})]}),(0,_.jsx)(c.A,{anchorEl:H,open:Boolean(H),onClose:()=>se(null),children:(0,_.jsx)(d.A,{onClick:()=>se("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===Z,children:"Accessories"})})]}),(0,_.jsxs)("div",{className:"filters",children:[(0,_.jsxs)(l.A,{color:"error",variant:"outlined",onClick:e=>Q(e.currentTarget),children:["Sort By\xa0",(0,_.jsx)(o.g,{icon:i.OM7})]}),(0,_.jsxs)(c.A,{anchorEl:q,open:Boolean(q),onClose:()=>oe(null),children:[(0,_.jsx)(d.A,{onClick:()=>oe("updated_at"),selected:"updated_at"===K,children:"Sort by CP"}),(0,_.jsx)(d.A,{onClick:()=>oe("price"),selected:"price"===K,children:"Sort by Price"})]})]})]}),L?(0,_.jsx)(a.A,{sx:{textAlign:"center",fontStyle:"italic",color:"text.secondary"},children:"No Loans Found"}):(0,_.jsxs)(E,{children:[G&&(0,_.jsx)(k.default,{selectedCreator:J,modalIsOpen:G,closeModal:()=>X(!1)}),ie.map((r=>{var t;if(null===(t=r.owners)||void 0===t||!t.length)return null;const n=r.owners[0];"FRACTIONAL"===r.loan_type?r.fractional_amount:r.loan_amount;return(0,_.jsxs)(T,{onClick:()=>{e((0,b.ce)(r._id)),e((0,b.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price}))},children:[(0,_.jsx)(a.A,{sx:{position:"relative",flex:1,display:"flex",alignItems:"center",justifyContent:"center"},children:r.owners.map((e=>(0,_.jsx)(a.A,{sx:{position:"absolute",top:8,left:8},children:Y[e.user]?(0,_.jsx)(a.A,{component:"a",onClick:r=>{r.stopPropagation(),r.preventDefault(),W(Y[e.user]._id),X(!0)},className:"player",children:(0,_.jsx)(S.A,{user_id:Y[e.user]._id,src:Y[e.user].avatar,rank:Y[e.user].totalWagered,accessory:Y[e.user].accessory,alt:"",username:Y[e.user].username,darkMode:U})}):(0,_.jsx)(x.A,{variant:"circular",width:40,height:40})},e.user)))}),(0,_.jsxs)(a.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,_.jsxs)(a.A,{children:[(0,_.jsx)(u.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,_.jsx)(p.A,{children:(0,_.jsx)(f.A,{size:"small","aria-label":"loan-details-table",children:(0,_.jsxs)(h.A,{children:[(0,_.jsxs)(m.A,{children:[(0,_.jsxs)(j.A,{sx:{color:"#bbb"},children:[(0,_.jsx)(o.g,{icon:i._2z})," ",n.rentOption?"Price / month":"Price / unit",":"]}),(0,_.jsx)(j.A,{sx:{color:"#ff8500"},children:(0,I.a)(n.price,F)})]}),(0,_.jsxs)(m.A,{children:[(0,_.jsxs)(j.A,{sx:{color:"#bbb"},children:[(0,_.jsx)(o.g,{icon:i.kwR})," Quantity:"]}),(0,_.jsxs)(j.A,{sx:{color:"#ff8500"},children:[n.onSale," / ",r.total_count]})]})]})})})]}),(0,_.jsx)(a.A,{sx:{textAlign:"right",mt:1},children:(0,_.jsx)(A.A,{title:n.rentOption?"Rent":"Trade",children:(0,_.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,_.jsx)(y.A,{}),onClick:t=>{if(t.stopPropagation(),e((0,b.ce)(r._id)),e((0,b.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price})),n.user!==z)if(r.showConfirmationModal){const t=window.confirm(r.message);e(t?(0,C.Gu)(n.rentOption?"rent":"trade"):(0,C.NX)("TRADE ACTION CANCELLED,PUSSY-ED OUT"))}else e((0,C.Gu)(n.rentOption?"rent":"trade"));else e((0,C.NX)("THIS IS LITERALLY YOURS ALREADY!"))},children:n.rentOption?"Rent":"Trade"})})})]})]},`${r._id}-${n.user}`)}))]}),!L&&(0,_.jsx)(P,{children:(0,_.jsx)(g.A,{page:D,count:s,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,b.Se)(100,t,K,Z))}})})]})}),G&&(0,_.jsx)(k.default,{selectedCreator:J,modalIsOpen:G,closeModal:()=>X(!1)})]})}),L=()=>(0,_.jsx)(D,{})},82462:(e,r,t)=>{t.r(r),t.d(r,{default:()=>j});var n=t(65043),s=t(22166),o=t(53062),i=t(30815),a=t(94496),l=t(42518),c=t(6354),d=t(92127),x=t(12639),u=t(67957),p=t(4636),f=t(83337),h=t(83034),m=t(70579);const j=function(e){let{modalIsOpen:r,closeModal:t}=e;const j=(0,s.d4)((e=>e.auth.isDarkMode)),[A,g]=(0,n.useState)(!1),[y]=(0,n.useState)("updated_at"),[v]=(0,n.useState)("653ee81117c9f5ee2124564b"),b=(0,h.T)(j?"dark":"light");return(0,m.jsxs)(c.A,{theme:b,children:[(0,m.jsx)(o.A,{open:r||!1,onClose:t,closeAfterTransition:!0,BackdropProps:{style:{backgroundColor:"rgba(0, 0, 0, 0.8)"}},sx:{zIndex:1300},children:(0,m.jsxs)(i.A,{sx:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",bgcolor:"#0a0a0a",color:"#fff",boxShadow:24,p:3,borderRadius:1,width:"90%",maxWidth:800,maxHeight:"90vh",overflowY:"auto"},children:[(0,m.jsxs)(i.A,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2},children:[(0,m.jsxs)(a.A,{variant:"h6",sx:{display:"flex",alignItems:"center",gap:1},children:[(0,m.jsx)(d.g,{icon:x.ITF}),"MARKETPLACE"]}),(0,m.jsx)(l.A,{variant:"text",color:"error",onClick:t,sx:{fontSize:"1.25rem"},children:"\xd7"})]}),(0,m.jsx)(i.A,{sx:{mb:2},children:(0,m.jsx)(p.default,{itemType:v,sortCriteria:y})}),(0,m.jsx)(i.A,{sx:{display:"flex",justifyContent:"flex-end"},children:(0,m.jsx)(l.A,{variant:"contained",color:"error",onClick:()=>g(!0),startIcon:(0,m.jsx)(u.A,{}),children:"List Item For Sale"})})]})}),A&&(0,m.jsx)(f.default,{modalIsOpen:A,closeModal:()=>g(!1)})]})}},83337:(e,r,t)=>{t.r(r),t.d(r,{default:()=>B});var n=t(65043),s=t(22166),o=t(53062),i=t(30815),a=t(94496),l=t(42518),c=t(67957),d=t(92127),x=t(12639),u=t(1529),p=t(6354),f=t(688),h=t(32143),m=t(78185),j=t(79650),A=t(71806),g=t(73460),y=t(28076),v=t(10039),b=t(18483),w=t(59135),C=t(59662),S=t(70579);const k=(0,C.A)((0,S.jsx)("path",{d:"M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12z"}),"Cancel");var I=t(31973),R=t(28104),O=t(84375),_=t(95575),N=t(74458),M=t(57498),E=t(29777),P=t(83034);const T=u.Ay.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`,D=u.Ay.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`,L=u.Ay.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  width: 100%;
  margin: 20px 0;

  @media (min-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`,U=u.Ay.div`
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
`;const z=function(){const e=(0,s.wA)(),{data:r,pages:t,page:o,loading:c,accessory:u,isDarkMode:C,userInfo:z,isLowGraphics:F}=(0,s.d4)((e=>({data:e.itemReducer.myItemArray,pages:e.itemReducer.pages,page:e.itemReducer.page,loading:e.itemReducer.loading,accessory:e.itemReducer.accessory,isDarkMode:e.auth.isDarkMode,userInfo:e.auth.user,isLowGraphics:e.auth.isLowGraphics}))),[Y,B]=(0,n.useState)({}),[G,X]=(0,n.useState)(!1),[J,W]=(0,n.useState)(""),[H,$]=(0,n.useState)(null),[q,Q]=(0,n.useState)("updated_at"),[K,V]=(0,n.useState)("653ee81117c9f5ee2124564b"),Z=(0,n.useRef)(),ee=(0,P.T)(C?"dark":"light");(0,n.useEffect)((()=>{null!==z&&void 0!==z&&z._id&&(e((0,O.X4)(z._id)),e((0,R.g0)(100,o,q,K)))}),[e,null===z||void 0===z?void 0:z._id,o,q,K]),(0,n.useEffect)((()=>{const t=Z.current,n=JSON.stringify((null===r||void 0===r?void 0:r.owners)||[]);t&&t!==n&&e((0,R.g0)(100,o,q,K)),Z.current=n}),[r,e,o,q,K]),(0,n.useEffect)((()=>{te()}),[r]);const re=async()=>{await e((0,R.g0)(100,o,q,K))},te=async()=>{if(r)for(const n of r)if(n.owners&&n.owners.length>0)for(const r of n.owners)if(!Y[r.user])try{const t=await e((0,N.Jx)(r.user));B((e=>({...e,[r.user]:t.payload||{username:"Anon",avatar:"default-avatar-url"}})))}catch(t){console.error(`Error fetching customer info for ${r.user}:`,t)}},ne=e=>{$(null),e&&(V(e),re())},se=async(r,t)=>{var n;const s=await e((0,O.Ci)({item_id:r}));null!==(n=s.payload)&&void 0!==n&&n.success?(e((0,O.X4)(z._id)),re(),e((0,_.NX)(s.payload.message,"-cat"))):e((0,_.NX)("Unable to Equip item. De-List item first."))};return(0,S.jsx)(p.A,{theme:ee,children:(0,S.jsx)(i.A,{sx:{background:"#080808",borderRadius:"0.3em",p:"20px"},children:(0,S.jsxs)(T,{children:[(0,S.jsx)(D,{children:(0,S.jsxs)("div",{className:"filters",children:[(0,S.jsxs)(l.A,{color:"error",variant:"outlined",onClick:e=>$(e.currentTarget),children:["Filter ",(0,S.jsx)(d.g,{icon:x.mRM})]}),(0,S.jsx)(f.A,{anchorEl:H,open:Boolean(H),onClose:()=>ne(null),children:(0,S.jsx)(h.A,{onClick:()=>ne("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===K,children:"Accessory"})})]})}),c?(0,S.jsx)(i.A,{sx:{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center",mt:2},children:Array.from(new Array(6)).map(((e,r)=>(0,S.jsxs)(i.A,{children:[(0,S.jsx)(m.A,{variant:"rectangular",width:165,height:160,sx:{mb:1}}),(0,S.jsx)(m.A,{variant:"text",width:120}),(0,S.jsx)(m.A,{variant:"text",width:100})]},r)))}):(0,S.jsx)(L,{children:null===r||void 0===r?void 0:r.map((r=>(0,S.jsxs)(i.A,{sx:{backgroundColor:"#2e2e2e",borderRadius:2,height:320,display:"flex",flexDirection:"column",overflow:"hidden",cursor:"pointer",transition:"transform 0.2s","&:hover":{transform:"scale(1.03)"}},onClick:()=>{e((0,R.ce)(r._id)),e((0,R.dd)({item_type:r.item_type,productName:r.productName,rentOption:r.rentOption,price:r.price,onSale:r.onSale}))},children:[(0,S.jsx)(i.A,{sx:{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}),(0,S.jsxs)(i.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,S.jsxs)(i.A,{children:[(0,S.jsx)(a.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,S.jsx)(j.A,{children:(0,S.jsx)(A.A,{className:"product-detail",children:(0,S.jsxs)(g.A,{children:[r.rentOption&&0===r.onSale?(0,S.jsxs)(y.A,{children:[(0,S.jsxs)(v.A,{sx:{color:"#bbb"},children:[(0,S.jsx)(d.g,{icon:x._2z})," Cost Per Month:"]}),(0,S.jsx)(v.A,{sx:{color:"#ff8500"},children:(0,E.a)(r.price)})]}):(0,S.jsxs)(y.A,{children:[(0,S.jsxs)(v.A,{sx:{color:"#bbb"},children:[(0,S.jsx)(d.g,{icon:x._2z})," ",r.rentOption?"Price Per Month:":"Price Per Unit:"]}),(0,S.jsx)(v.A,{sx:{color:"#ff8500"},children:(0,E.a)(r.price)})]}),r.rentOption&&0===r.onSale?null:(0,S.jsxs)(y.A,{children:[(0,S.jsx)(v.A,{sx:{color:"#bbb"},children:r.rentOption?"Renting Out:":"On Sale:"}),(0,S.jsx)(v.A,{sx:{color:"#ff8500"},children:r.onSale})]}),(0,S.jsxs)(y.A,{children:[(0,S.jsxs)(v.A,{sx:{color:"#bbb"},children:[(0,S.jsx)(d.g,{icon:x.kwR})," Total:"]}),(0,S.jsx)(v.A,{sx:{color:"#ff8500"},children:r.total_count})]}),(0,S.jsxs)(y.A,{children:[(0,S.jsxs)(v.A,{sx:{color:"#bbb"},children:[(0,S.jsx)(d.g,{icon:x.R70})," Type:"]}),(0,S.jsx)(v.A,{sx:{color:"#ff8500"},children:"Accessory"})]})]})})})]}),(0,S.jsxs)(i.A,{sx:{display:"flex",gap:1,justifyContent:"flex-end",mt:1},children:[0===r.onSale&&r.rentOption?(0,S.jsx)(b.A,{title:"Discontinue Renting",children:(0,S.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,S.jsx)(k,{}),onClick:t=>{var n;t.stopPropagation(),n=r._id,e((0,R.ce)(n)),e((0,R.eU)(n))},children:"RETURN"})}):(0,S.jsxs)(S.Fragment,{children:[r.onSale!==r.total_count&&(0,S.jsx)(b.A,{title:"List Item",children:(0,S.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,S.jsx)(I.A,{}),onClick:t=>{t.stopPropagation(),(r=>{e((0,R.ce)(r._id)),e((0,R.dd)({item_type:r.item_type,productName:r.productName,rentOption:r.rentOption,price:r.price,onSale:r.onSale})),e((0,_.Fr)())})(r)},children:"LIST"})}),r.onSale>0&&(0,S.jsx)(b.A,{title:"De-List Item",children:(0,S.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,S.jsx)(I.A,{}),onClick:t=>{t.stopPropagation(),(r=>{e((0,R.ce)(r._id)),e((0,_.a1)())})(r)},children:"DE-LIST"})})]}),"653ee81117c9f5ee2124564b"===r.item_type&&0===r.onSale&&(0,S.jsx)(b.A,{title:u&&u===r.image?"Unequip Item":"Equip Item",children:(0,S.jsx)(l.A,{variant:"contained",color:"error",startIcon:(0,S.jsx)(I.A,{}),onClick:e=>{e.stopPropagation(),se(r._id,r.image)},children:u&&u===r.image?"UNEQUIP":"EQUIP"})})]})]})]},r._id)))}),!c&&(0,S.jsx)(U,{children:(0,S.jsx)(w.A,{page:o,count:t,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,R.g0)(100,t,q,K))}})}),G&&(0,S.jsx)(M.default,{selectedCreator:J,modalIsOpen:G,closeModal:()=>X(!1)})]})})})};const F=function(){return(0,S.jsx)(z,{})};var Y=t(82462);const B=function(e){let{modalIsOpen:r,closeModal:t}=e;const u=(0,s.d4)((e=>e.auth.isDarkMode)),p=(0,s.d4)((e=>e.logic.solPrice)),[f,h]=(0,n.useState)(!1);return(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(o.A,{open:r||!1,onClose:t,closeAfterTransition:!0,sx:{zIndex:1300},BackdropProps:{style:{backgroundColor:"rgba(0, 0, 0, 0.8)"}},children:(0,S.jsxs)(i.A,{sx:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",bgcolor:"#0a0a0a",color:"#fff",boxShadow:24,borderRadius:1,p:3,width:600,maxWidth:"90vw",maxHeight:"90vh",overflowY:"auto"},children:[(0,S.jsxs)(i.A,{sx:{display:"flex",justifyContent:"space-between",mb:2},children:[(0,S.jsxs)(a.A,{variant:"h6",sx:{display:"flex",alignItems:"center",fontWeight:"bold"},children:[(0,S.jsx)(d.g,{icon:x.THi,style:{marginRight:8}}),"INVENTORY"]}),(0,S.jsx)(l.A,{variant:"text",color:"error",onClick:t,children:"\xd7"})]}),(0,S.jsx)(F,{solPrice:p}),(0,S.jsx)(i.A,{sx:{display:"flex",justifyContent:"flex-end",gap:2},children:(0,S.jsx)(l.A,{variant:"contained",color:"error",onClick:()=>h(!0),startIcon:(0,S.jsx)(c.A,{}),children:"BUY More"})})]})}),f&&(0,S.jsx)(Y.default,{modalIsOpen:f,closeModal:()=>h(!1),isDarkMode:u})]})}}}]);
//# sourceMappingURL=8374.07b4d752.chunk.js.map