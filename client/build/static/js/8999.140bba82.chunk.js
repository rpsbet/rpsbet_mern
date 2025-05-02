"use strict";(self.webpackChunkclient=self.webpackChunkclient||[]).push([[8999],{31973:(e,r,t)=>{t.d(r,{A:()=>o});var n=t(66734),s=t(70579);const o=(0,n.A)((0,s.jsx)("path",{d:"M6.99 11 3 15l3.99 4v-3H14v-2H6.99zM21 9l-3.99-4v3H10v2h7.01v3z"}),"SwapHoriz")},38999:(e,r,t)=>{t.r(r),t.d(r,{default:()=>q});var n=t(65043),s=t(22166),o=t(53062),i=t(30815),l=t(94496),a=t(42518),c=t(6354),d=t(92127),x=t(12639),u=t(67957),p=t(1529),h=(t(86178),t(688)),f=t(32143),j=t(78185),m=t(79650),A=t(71806),g=t(73460),y=t(28076),b=t(10039),v=t(18483),w=t(59135),C=t(31973),k=t(28104),S=t(74458),I=t(95575),R=t(60916),O=t(57498),_=t(29777),N=t(83034),M=t(70579);const E=p.Ay.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  width: 100%;
`,P=p.Ay.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`,T=p.Ay.div`
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
`,D=p.Ay.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`,L=p.Ay.div`
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
`,z=(p.Ay.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #28a745;
  color: #fff;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
`,p.Ay.div`
  display: flex;
  justify-content: center;
`,()=>{const e=(0,s.wA)(),r=(0,N.T)((0,s.d4)((e=>e.auth.isDarkMode))?"dark":"light"),t=(0,s.d4)((e=>e.itemReducer.itemArray)),o=(0,s.d4)((e=>e.itemReducer.pages)),u=(0,s.d4)((e=>e.itemReducer.page)),p=(0,s.d4)((e=>e.itemReducer.loading)),z=(0,s.d4)((e=>e.auth.isDarkMode)),U=(0,s.d4)((e=>e.auth.user)),F=(0,s.d4)((e=>e.logic.solPrice)),[B,Y]=((0,s.d4)((e=>e.auth.isLowGraphics)),(0,n.useState)({})),[H,G]=(0,n.useState)(!1),[X,J]=(0,n.useState)(""),[W,$]=(0,n.useState)(null),[q,Q]=(0,n.useState)(null),[K,V]=(0,n.useState)("updated_at"),[Z,ee]=(0,n.useState)("653ee81117c9f5ee2124564b"),re=(0,n.useRef)(JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]));(0,n.useEffect)((()=>{const e=re.current,r=JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]);e!==r&&(te(),re.current=r)})),(0,n.useEffect)((()=>{te()}),[]),(0,n.useEffect)((()=>{t&&t.length>0&&ne()}),[t,e]);const te=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:K,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:Z;e((0,k.Se)(100,u,r,t))},ne=async()=>{if(t)for(const n of t)if(n.owners&&n.owners.length>0)for(const t of n.owners)if(!B[t.user])try{const r=await e((0,S.Jx)(t.user));Y((e=>({...e,[t.user]:r||{username:"Anon",avatar:"default-avatar-url"}})))}catch(r){console.error(`Error fetching customer info for ${t.user}:`,r)}},se=e=>{$(null),e&&(ee(e),te(K,e))},oe=e=>{Q(null),e&&(V(e),te(e,Z))},ie=t?[...t].sort(((e,r)=>{const t=e[K],n=r[K];return"asc"===K?t-n:n-t})):[];return(0,M.jsxs)(c.A,{theme:r,children:[(0,M.jsx)(i.A,{sx:{background:"#080808",borderRadius:"0.3em",p:"20px"},children:(0,M.jsxs)(E,{children:[(0,M.jsxs)(P,{children:[(0,M.jsxs)("div",{className:"filters",children:[(0,M.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>$(e.currentTarget),children:["Filter\xa0",(0,M.jsx)(d.g,{icon:x.mRM})]}),(0,M.jsx)(h.A,{anchorEl:W,open:Boolean(W),onClose:()=>se(null),children:(0,M.jsx)(f.A,{onClick:()=>se("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===Z,children:"Accessories"})})]}),(0,M.jsxs)("div",{className:"filters",children:[(0,M.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>Q(e.currentTarget),children:["Sort By\xa0",(0,M.jsx)(d.g,{icon:x.OM7})]}),(0,M.jsxs)(h.A,{anchorEl:q,open:Boolean(q),onClose:()=>oe(null),children:[(0,M.jsx)(f.A,{onClick:()=>oe("updated_at"),selected:"updated_at"===K,children:"Sort by CP"}),(0,M.jsx)(f.A,{onClick:()=>oe("price"),selected:"price"===K,children:"Sort by Price"})]})]})]}),p?(0,M.jsx)(i.A,{sx:{textAlign:"center",fontStyle:"italic",color:"text.secondary"},children:"No Loans Found"}):(0,M.jsxs)(T,{children:[H&&(0,M.jsx)(O.default,{selectedCreator:X,modalIsOpen:H,closeModal:()=>G(!1)}),ie.map((r=>{var t;if(null===(t=r.owners)||void 0===t||!t.length)return null;const n=r.owners[0];"FRACTIONAL"===r.loan_type?r.fractional_amount:r.loan_amount;return(0,M.jsxs)(L,{onClick:()=>{e((0,k.ce)(r._id)),e((0,k.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price}))},children:[(0,M.jsx)(i.A,{sx:{position:"relative",flex:1,display:"flex",alignItems:"center",justifyContent:"center"},children:r.owners.map((e=>(0,M.jsx)(i.A,{sx:{position:"absolute",top:8,left:8},children:B[e.user]?(0,M.jsx)(i.A,{component:"a",onClick:r=>{r.stopPropagation(),r.preventDefault(),J(B[e.user]._id),G(!0)},className:"player",children:(0,M.jsx)(R.A,{user_id:B[e.user]._id,src:B[e.user].avatar,rank:B[e.user].totalWagered,accessory:B[e.user].accessory,elite:B[e.user].elite,alt:"",username:B[e.user].username,darkMode:z})}):(0,M.jsx)(j.A,{variant:"circular",width:40,height:40})},e.user)))}),(0,M.jsxs)(i.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,M.jsxs)(i.A,{children:[(0,M.jsx)(l.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,M.jsx)(m.A,{children:(0,M.jsx)(A.A,{size:"small","aria-label":"loan-details-table",children:(0,M.jsxs)(g.A,{children:[(0,M.jsxs)(y.A,{children:[(0,M.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,M.jsx)(d.g,{icon:x._2z})," ",n.rentOption?"Price / month":"Price / unit",":"]}),(0,M.jsx)(b.A,{sx:{color:"#ff8500"},children:(0,_.a)(n.price,F)})]}),(0,M.jsxs)(y.A,{children:[(0,M.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,M.jsx)(d.g,{icon:x.kwR})," Quantity:"]}),(0,M.jsxs)(b.A,{sx:{color:"#ff8500"},children:[n.onSale," / ",r.total_count]})]})]})})})]}),(0,M.jsx)(i.A,{sx:{textAlign:"right",mt:1},children:(0,M.jsx)(v.A,{title:n.rentOption?"Rent":"Trade",children:(0,M.jsx)(a.A,{variant:"outlined",color:"error",startIcon:(0,M.jsx)(C.A,{}),onClick:t=>{if(t.stopPropagation(),e((0,k.ce)(r._id)),e((0,k.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price})),n.user!==U)if(r.showConfirmationModal){const t=window.confirm(r.message);e(t?(0,I.Gu)(n.rentOption?"rent":"trade"):(0,I.NX)("TRADE ACTION CANCELLED,PUSSY-ED OUT"))}else e((0,I.Gu)(n.rentOption?"rent":"trade"));else e((0,I.NX)("THIS IS LITERALLY YOURS ALREADY!"))},children:n.rentOption?"Rent":"Trade"})})})]})]},`${r._id}-${n.user}`)}))]}),!p&&(0,M.jsx)(D,{children:(0,M.jsx)(w.A,{page:u,count:o,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,k.Se)(100,t,K,Z))}})})]})}),H&&(0,M.jsx)(O.default,{selectedCreator:X,modalIsOpen:H,closeModal:()=>G(!1)})]})}),U=()=>(0,M.jsx)(z,{});var F=t(91794),B=t(84375);const Y=p.Ay.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`,H=p.Ay.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`,G=p.Ay.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  width: 100%;
  margin: 20px 0;

  @media (min-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`,X=p.Ay.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;p.Ay.div`
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
`;const J=function(){const e=(0,s.wA)(),{data:r,pages:t,page:o,loading:u,accessory:p,isDarkMode:R,userInfo:E,isLowGraphics:P}=(0,s.d4)((e=>({data:e.itemReducer.myItemArray,pages:e.itemReducer.pages,page:e.itemReducer.page,loading:e.itemReducer.loading,accessory:e.itemReducer.accessory,isDarkMode:e.auth.isDarkMode,userInfo:e.auth.user,isLowGraphics:e.auth.isLowGraphics}))),[T,D]=(0,n.useState)({}),[L,z]=(0,n.useState)(!1),[U,J]=(0,n.useState)(""),[W,$]=(0,n.useState)(null),[q,Q]=(0,n.useState)("updated_at"),[K,V]=(0,n.useState)("653ee81117c9f5ee2124564b"),Z=(0,n.useRef)(),ee=(0,N.T)(R?"dark":"light");(0,n.useEffect)((()=>{null!==E&&void 0!==E&&E._id&&(e((0,B.X4)(E._id)),e((0,k.g0)(100,o,q,K)))}),[e,null===E||void 0===E?void 0:E._id,o,q,K]),(0,n.useEffect)((()=>{const t=Z.current,n=JSON.stringify((null===r||void 0===r?void 0:r.owners)||[]);t&&t!==n&&e((0,k.g0)(100,o,q,K)),Z.current=n}),[r,e,o,q,K]),(0,n.useEffect)((()=>{te()}),[r]);const re=async()=>{await e((0,k.g0)(100,o,q,K))},te=async()=>{if(r)for(const n of r)if(n.owners&&n.owners.length>0)for(const r of n.owners)if(!T[r.user])try{const t=await e((0,S.Jx)(r.user));D((e=>({...e,[r.user]:t.payload||{username:"Anon",avatar:"default-avatar-url"}})))}catch(t){console.error(`Error fetching customer info for ${r.user}:`,t)}},ne=e=>{$(null),e&&(V(e),re())},se=async(r,t)=>{var n;const s=await e((0,B.Ci)({item_id:r}));null!==(n=s.payload)&&void 0!==n&&n.success?(e((0,B.X4)(E._id)),re(),e((0,I.NX)(s.payload.message,"-cat"))):e((0,I.NX)("Unable to Equip item. De-List item first."))};return(0,M.jsx)(c.A,{theme:ee,children:(0,M.jsx)(i.A,{sx:{background:"#080808",borderRadius:"0.3em",p:"20px"},children:(0,M.jsxs)(Y,{children:[(0,M.jsx)(H,{children:(0,M.jsxs)("div",{className:"filters",children:[(0,M.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>$(e.currentTarget),children:["Filter ",(0,M.jsx)(d.g,{icon:x.mRM})]}),(0,M.jsx)(h.A,{anchorEl:W,open:Boolean(W),onClose:()=>ne(null),children:(0,M.jsx)(f.A,{onClick:()=>ne("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===K,children:"Accessory"})})]})}),u?(0,M.jsx)(i.A,{sx:{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center",mt:2},children:Array.from(new Array(6)).map(((e,r)=>(0,M.jsxs)(i.A,{children:[(0,M.jsx)(j.A,{variant:"rectangular",width:165,height:160,sx:{mb:1}}),(0,M.jsx)(j.A,{variant:"text",width:120}),(0,M.jsx)(j.A,{variant:"text",width:100})]},r)))}):(0,M.jsx)(G,{children:null===r||void 0===r?void 0:r.map((r=>(0,M.jsxs)(i.A,{sx:{backgroundColor:"#2e2e2e",borderRadius:2,height:320,display:"flex",flexDirection:"column",overflow:"hidden",cursor:"pointer",transition:"transform 0.2s","&:hover":{transform:"scale(1.03)"}},onClick:()=>{e((0,k.ce)(r._id)),e((0,k.dd)({item_type:r.item_type,productName:r.productName,rentOption:r.rentOption,price:r.price,onSale:r.onSale}))},children:[(0,M.jsx)(i.A,{sx:{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}),(0,M.jsxs)(i.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,M.jsxs)(i.A,{children:[(0,M.jsx)(l.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,M.jsx)(m.A,{children:(0,M.jsx)(A.A,{className:"product-detail",children:(0,M.jsxs)(g.A,{children:[r.rentOption&&0===r.onSale?(0,M.jsxs)(y.A,{children:[(0,M.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,M.jsx)(d.g,{icon:x._2z})," Cost Per Month:"]}),(0,M.jsx)(b.A,{sx:{color:"#ff8500"},children:(0,_.a)(r.price)})]}):(0,M.jsxs)(y.A,{children:[(0,M.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,M.jsx)(d.g,{icon:x._2z})," ",r.rentOption?"Price Per Month:":"Price Per Unit:"]}),(0,M.jsx)(b.A,{sx:{color:"#ff8500"},children:(0,_.a)(r.price)})]}),r.rentOption&&0===r.onSale?null:(0,M.jsxs)(y.A,{children:[(0,M.jsx)(b.A,{sx:{color:"#bbb"},children:r.rentOption?"Renting Out:":"On Sale:"}),(0,M.jsx)(b.A,{sx:{color:"#ff8500"},children:r.onSale})]}),(0,M.jsxs)(y.A,{children:[(0,M.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,M.jsx)(d.g,{icon:x.kwR})," Total:"]}),(0,M.jsx)(b.A,{sx:{color:"#ff8500"},children:r.total_count})]}),(0,M.jsxs)(y.A,{children:[(0,M.jsxs)(b.A,{sx:{color:"#bbb"},children:[(0,M.jsx)(d.g,{icon:x.R70})," Type:"]}),(0,M.jsx)(b.A,{sx:{color:"#ff8500"},children:"Accessory"})]})]})})})]}),(0,M.jsxs)(i.A,{sx:{display:"flex",gap:1,justifyContent:"flex-end",mt:1},children:[0===r.onSale&&r.rentOption?(0,M.jsx)(v.A,{title:"Discontinue Renting",children:(0,M.jsx)(a.A,{variant:"outlined",color:"error",startIcon:(0,M.jsx)(F.A,{}),onClick:t=>{var n;t.stopPropagation(),n=r._id,e((0,k.ce)(n)),e((0,k.eU)(n))},children:"RETURN"})}):(0,M.jsxs)(M.Fragment,{children:[r.onSale!==r.total_count&&(0,M.jsx)(v.A,{title:"List Item",children:(0,M.jsx)(a.A,{variant:"outlined",color:"error",startIcon:(0,M.jsx)(C.A,{}),onClick:t=>{t.stopPropagation(),(r=>{e((0,k.ce)(r._id)),e((0,k.dd)({item_type:r.item_type,productName:r.productName,rentOption:r.rentOption,price:r.price,onSale:r.onSale})),e((0,I.Fr)())})(r)},children:"LIST"})}),r.onSale>0&&(0,M.jsx)(v.A,{title:"De-List Item",children:(0,M.jsx)(a.A,{variant:"outlined",color:"error",startIcon:(0,M.jsx)(C.A,{}),onClick:t=>{t.stopPropagation(),(r=>{e((0,k.ce)(r._id)),e((0,I.a1)())})(r)},children:"DE-LIST"})})]}),"653ee81117c9f5ee2124564b"===r.item_type&&0===r.onSale&&(0,M.jsx)(v.A,{title:p&&p===r.image?"Unequip Item":"Equip Item",children:(0,M.jsx)(a.A,{variant:"outlined",color:"error",startIcon:(0,M.jsx)(C.A,{}),onClick:e=>{e.stopPropagation(),se(r._id,r.image)},children:p&&p===r.image?"UNEQUIP":"EQUIP"})})]})]})]},r._id)))}),!u&&(0,M.jsx)(X,{children:(0,M.jsx)(w.A,{page:o,count:t,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,k.g0)(100,t,q,K))}})}),L&&(0,M.jsx)(O.default,{selectedCreator:U,modalIsOpen:L,closeModal:()=>z(!1)})]})})})};const W=function(){return(0,M.jsx)(J,{})};const $=function(e){let{modalIsOpen:r,closeModal:t}=e;const c=(0,s.d4)((e=>e.auth.isDarkMode)),p=(0,s.d4)((e=>e.logic.solPrice)),[h,f]=(0,n.useState)(!1);return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(o.A,{open:r||!1,onClose:t,closeAfterTransition:!0,sx:{zIndex:1300},BackdropProps:{style:{backgroundColor:"rgba(0, 0, 0, 0.8)"}},children:(0,M.jsxs)(i.A,{sx:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",color:"#fff",width:"90vw",height:"80vh",overflowY:"auto",borderRadius:2,boxShadow:24,p:3,background:"rgba(0, 0, 0, 0.2)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255, 255, 255, 0.2)","@supports not (backdrop-filter: blur(10px))":{background:"rgba(0, 0, 0, 0.4)"}},children:[(0,M.jsxs)(i.A,{sx:{display:"flex",justifyContent:"space-between",mb:2},children:[(0,M.jsxs)(l.A,{variant:"h6",sx:{display:"flex",alignItems:"center",fontWeight:"bold"},children:[(0,M.jsx)(d.g,{icon:x.THi,style:{marginRight:8}}),"INVENTORY"]}),(0,M.jsx)(a.A,{variant:"text",color:"error",onClick:t,children:"\xd7"})]}),(0,M.jsx)(W,{solPrice:p}),(0,M.jsx)(i.A,{sx:{display:"flex",justifyContent:"flex-end",gap:2},children:(0,M.jsx)(a.A,{variant:"outlined",color:"error",onClick:()=>f(!0),startIcon:(0,M.jsx)(u.A,{}),children:"BUY More"})})]})}),h&&(0,M.jsx)(q,{modalIsOpen:h,closeModal:()=>f(!1),isDarkMode:c})]})};const q=function(e){let{modalIsOpen:r,closeModal:t}=e;const p=(0,s.d4)((e=>e.auth.isDarkMode)),[h,f]=(0,n.useState)(!1),[j]=(0,n.useState)("updated_at"),[m]=(0,n.useState)("653ee81117c9f5ee2124564b"),A=(0,N.T)(p?"dark":"light");return(0,M.jsxs)(c.A,{theme:A,children:[(0,M.jsx)(o.A,{open:r||!1,onClose:t,closeAfterTransition:!0,BackdropProps:{style:{backgroundColor:"rgba(0, 0, 0, 0.8)"}},sx:{zIndex:1300},children:(0,M.jsxs)(i.A,{sx:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",bgcolor:"#0a0a0a",color:"#fff",boxShadow:24,p:3,borderRadius:1,width:"90%",maxWidth:800,maxHeight:"90vh",overflowY:"auto"},children:[(0,M.jsxs)(i.A,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2},children:[(0,M.jsxs)(l.A,{variant:"h6",sx:{display:"flex",alignItems:"center",gap:1},children:[(0,M.jsx)(d.g,{icon:x.ITF}),"MARKETPLACE"]}),(0,M.jsx)(a.A,{variant:"text",color:"error",onClick:t,sx:{fontSize:"1.25rem"},children:"\xd7"})]}),(0,M.jsx)(i.A,{sx:{mb:2},children:(0,M.jsx)(U,{itemType:m,sortCriteria:j})}),(0,M.jsx)(i.A,{sx:{display:"flex",justifyContent:"flex-end"},children:(0,M.jsx)(a.A,{variant:"outlined",color:"error",onClick:()=>f(!0),startIcon:(0,M.jsx)(u.A,{}),children:"List Item For Sale"})})]})}),h&&(0,M.jsx)($,{modalIsOpen:h,closeModal:()=>f(!1)})]})}},91794:(e,r,t)=>{t.d(r,{A:()=>o});var n=t(66734),s=t(70579);const o=(0,n.A)((0,s.jsx)("path",{d:"M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12z"}),"Cancel")}}]);
//# sourceMappingURL=8999.140bba82.chunk.js.map