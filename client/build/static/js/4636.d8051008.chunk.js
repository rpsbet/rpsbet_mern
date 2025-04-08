"use strict";(self.webpackChunkclient=self.webpackChunkclient||[]).push([[4636],{4636:(e,r,t)=>{t.r(r),t.d(r,{default:()=>P});var n=t(65043),i=t(1529),s=(t(10844),t(92127)),o=t(12639),l=t(7353),a=t(42518),c=t(688),d=t(32143),u=t(78185),x=t(94496),p=t(79650),h=t(71806),f=t(73460),m=t(28076),g=t(10039),A=t(59135),j=t(31973),y=t(22166),v=t(28104),w=t(74458),b=t(95575),C=t(60916),S=t(57498),k=t(29777),O=t(42281),N=t(39412),R=t(83034),_=t(70579);const E=i.Ay.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  width: 100%;
`,T=i.Ay.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`,I=i.Ay.div`
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
`,D=i.Ay.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`,L=i.Ay.div`
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
`,M=(i.Ay.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #28a745;
  color: #fff;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
`,i.Ay.div`
  display: flex;
  justify-content: center;
`,()=>{const e=(0,y.wA)(),r=(0,R.T)((0,y.d4)((e=>e.auth.isDarkMode))?"dark":"light"),t=(0,y.d4)((e=>e.itemReducer.itemArray)),i=(0,y.d4)((e=>e.itemReducer.pages)),M=(0,y.d4)((e=>e.itemReducer.page)),P=(0,y.d4)((e=>e.itemReducer.loading)),z=(0,y.d4)((e=>e.auth.isDarkMode)),Y=(0,y.d4)((e=>e.auth.user)),B=(0,y.d4)((e=>e.logic.solPrice)),F=(0,y.d4)((e=>e.auth.isLowGraphics)),[G,J]=(0,n.useState)({}),[U,$]=(0,n.useState)(!1),[H,W]=(0,n.useState)(""),[X,Q]=(0,n.useState)(null),[q,K]=(0,n.useState)(null),[V,Z]=(0,n.useState)("updated_at"),[ee,re]=(0,n.useState)("653ee81117c9f5ee2124564b"),te=(0,n.useRef)(JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]));(0,n.useEffect)((()=>{const e=te.current,r=JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]);e!==r&&(ne(),te.current=r)})),(0,n.useEffect)((()=>{ne()}),[]),(0,n.useEffect)((()=>{t&&t.length>0&&ie()}),[t,e]);const ne=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:V,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:ee;e((0,v.Se)(100,M,r,t))},ie=async()=>{if(t)for(const n of t)if(n.owners&&n.owners.length>0)for(const t of n.owners)if(!G[t.user])try{const r=await e((0,w.Jx)(t.user));J((e=>({...e,[t.user]:r||{username:"Anon",avatar:"default-avatar-url"}})))}catch(r){console.error(`Error fetching customer info for ${t.user}:`,r)}},se=e=>{Q(null),e&&(re(e),ne(V,e))},oe=e=>{K(null),e&&(Z(e),ne(e,ee))},le=t?[...t].sort(((e,r)=>{const t=e[V],n=r[V];return"asc"===V?t-n:n-t})):[];return(0,_.jsxs)(N.A,{theme:r,children:[(0,_.jsx)(l.A,{sx:{background:"#2D3A4A",borderRadius:"0.3em",p:"20px"},children:(0,_.jsxs)(E,{children:[(0,_.jsxs)(T,{children:[(0,_.jsxs)("div",{className:"filters",children:[(0,_.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>Q(e.currentTarget),children:["Filter\xa0",(0,_.jsx)(s.g,{icon:o.mRM})]}),(0,_.jsx)(c.A,{anchorEl:X,open:Boolean(X),onClose:()=>se(null),children:(0,_.jsx)(d.A,{onClick:()=>se("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===ee,children:"Accessories"})})]}),(0,_.jsxs)("div",{className:"filters",children:[(0,_.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>K(e.currentTarget),children:["Sort By\xa0",(0,_.jsx)(s.g,{icon:o.OM7})]}),(0,_.jsxs)(c.A,{anchorEl:q,open:Boolean(q),onClose:()=>oe(null),children:[(0,_.jsx)(d.A,{onClick:()=>oe("updated_at"),selected:"updated_at"===V,children:"Sort by CP"}),(0,_.jsx)(d.A,{onClick:()=>oe("price"),selected:"price"===V,children:"Sort by Price"})]})]})]}),P?(0,_.jsx)(l.A,{sx:{textAlign:"center",fontStyle:"italic",color:"text.secondary"},children:"No Loans Found"}):(0,_.jsxs)(I,{children:[U&&(0,_.jsx)(S.default,{selectedCreator:H,modalIsOpen:U,closeModal:()=>$(!1)}),le.map((r=>{var t;if(null===(t=r.owners)||void 0===t||!t.length)return null;const n=r.owners[0];"FRACTIONAL"===r.loan_type?r.fractional_amount:r.loan_amount;return(0,_.jsxs)(L,{onClick:()=>{e((0,v.ce)(r._id)),e((0,v.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price}))},children:[(0,_.jsxs)(l.A,{sx:{position:"relative",flex:1,display:"flex",alignItems:"center",justifyContent:"center"},children:[r.owners.map((e=>(0,_.jsx)(l.A,{sx:{position:"absolute",top:8,left:8},children:G[e.user]?(0,_.jsx)(l.A,{component:"a",onClick:r=>{r.stopPropagation(),r.preventDefault(),W(G[e.user]._id),$(!0)},className:"player",children:(0,_.jsx)(C.A,{user_id:G[e.user]._id,src:G[e.user].avatar,rank:G[e.user].totalWagered,accessory:G[e.user].accessory,alt:"",username:G[e.user].username,darkMode:z})}):(0,_.jsx)(u.A,{variant:"circular",width:40,height:40})},e.user))),r.image&&(0,O._)(r.image,F)?(0,_.jsx)(l.A,{sx:{width:80,height:80},children:(0,O._)(r.image,F)}):(0,_.jsx)(l.A,{component:"img",src:r.image,alt:r.productName,sx:{maxWidth:80,maxHeight:80,borderRadius:2}})]}),(0,_.jsxs)(l.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,_.jsxs)(l.A,{children:[(0,_.jsx)(x.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,_.jsx)(p.A,{children:(0,_.jsx)(h.A,{size:"small","aria-label":"loan-details-table",children:(0,_.jsxs)(f.A,{children:[(0,_.jsxs)(m.A,{children:[(0,_.jsxs)(g.A,{sx:{color:"#bbb"},children:[(0,_.jsx)(s.g,{icon:o._2z})," ",n.rentOption?"Price / month":"Price / unit",":"]}),(0,_.jsx)(g.A,{sx:{color:"#ff8500"},children:(0,k.a)(n.price,B)})]}),(0,_.jsxs)(m.A,{children:[(0,_.jsxs)(g.A,{sx:{color:"#bbb"},children:[(0,_.jsx)(s.g,{icon:o.kwR})," Quantity:"]}),(0,_.jsxs)(g.A,{sx:{color:"#ff8500"},children:[n.onSale," / ",r.total_count]})]})]})})})]}),(0,_.jsx)(l.A,{sx:{textAlign:"right",mt:1},children:(0,_.jsx)(Tooltip,{title:n.rentOption?"Rent":"Trade",children:(0,_.jsx)(a.A,{variant:"contained",color:"error",startIcon:(0,_.jsx)(j.A,{}),onClick:t=>{if(t.stopPropagation(),e((0,v.ce)(r._id)),e((0,v.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price})),n.user!==Y)if(r.showConfirmationModal){const t=window.confirm(r.message);e(t?(0,b.Gu)(n.rentOption?"rent":"trade"):(0,b.NX)("TRADE ACTION CANCELLED,PUSSY-ED OUT"))}else e((0,b.Gu)(n.rentOption?"rent":"trade"));else e((0,b.NX)("THIS IS LITERALLY YOURS ALREADY!"))},children:n.rentOption?"Rent":"Trade"})})})]})]},`${r._id}-${n.user}`)}))]}),!P&&(0,_.jsx)(D,{children:(0,_.jsx)(A.A,{page:M,count:i,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,v.Se)(100,t,V,ee))}})})]})}),U&&(0,_.jsx)(S.default,{selectedCreator:H,modalIsOpen:U,closeModal:()=>$(!1)})]})}),P=()=>(0,_.jsx)(M,{})}}]);
//# sourceMappingURL=4636.d8051008.chunk.js.map