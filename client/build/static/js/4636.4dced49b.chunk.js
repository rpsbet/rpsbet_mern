"use strict";(self.webpackChunkclient=self.webpackChunkclient||[]).push([[4636],{4636:(e,r,t)=>{t.r(r),t.d(r,{default:()=>P});var n=t(65043),s=t(1529),i=(t(86178),t(92127)),o=t(12639),l=t(30815),a=t(42518),c=t(688),d=t(32143),u=t(78185),x=t(94496),p=t(79650),f=t(71806),h=t(73460),m=t(28076),A=t(10039),j=t(59135),g=t(31973),y=t(22166),v=t(28104),w=t(74458),b=t(95575),C=t(60916),S=t(57498),k=t(29777),O=t(6354),N=t(83034),R=t(70579);const _=s.Ay.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  width: 100%;
`,E=s.Ay.div`
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
`,I=s.Ay.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`,L=s.Ay.div`
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
`,M=(s.Ay.div`
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
`,()=>{const e=(0,y.wA)(),r=(0,N.T)((0,y.d4)((e=>e.auth.isDarkMode))?"dark":"light"),t=(0,y.d4)((e=>e.itemReducer.itemArray)),s=(0,y.d4)((e=>e.itemReducer.pages)),M=(0,y.d4)((e=>e.itemReducer.page)),P=(0,y.d4)((e=>e.itemReducer.loading)),D=(0,y.d4)((e=>e.auth.isDarkMode)),z=(0,y.d4)((e=>e.auth.user)),Y=(0,y.d4)((e=>e.logic.solPrice)),[B,F]=((0,y.d4)((e=>e.auth.isLowGraphics)),(0,n.useState)({})),[G,J]=(0,n.useState)(!1),[U,$]=(0,n.useState)(""),[X,H]=(0,n.useState)(null),[Q,W]=(0,n.useState)(null),[q,K]=(0,n.useState)("updated_at"),[V,Z]=(0,n.useState)("653ee81117c9f5ee2124564b"),ee=(0,n.useRef)(JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]));(0,n.useEffect)((()=>{const e=ee.current,r=JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]);e!==r&&(re(),ee.current=r)})),(0,n.useEffect)((()=>{re()}),[]),(0,n.useEffect)((()=>{t&&t.length>0&&te()}),[t,e]);const re=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:q,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:V;e((0,v.Se)(100,M,r,t))},te=async()=>{if(t)for(const n of t)if(n.owners&&n.owners.length>0)for(const t of n.owners)if(!B[t.user])try{const r=await e((0,w.Jx)(t.user));F((e=>({...e,[t.user]:r||{username:"Anon",avatar:"default-avatar-url"}})))}catch(r){console.error(`Error fetching customer info for ${t.user}:`,r)}},ne=e=>{H(null),e&&(Z(e),re(q,e))},se=e=>{W(null),e&&(K(e),re(e,V))},ie=t?[...t].sort(((e,r)=>{const t=e[q],n=r[q];return"asc"===q?t-n:n-t})):[];return(0,R.jsxs)(O.A,{theme:r,children:[(0,R.jsx)(l.A,{sx:{background:"#080808",borderRadius:"0.3em",p:"20px"},children:(0,R.jsxs)(_,{children:[(0,R.jsxs)(E,{children:[(0,R.jsxs)("div",{className:"filters",children:[(0,R.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>H(e.currentTarget),children:["Filter\xa0",(0,R.jsx)(i.g,{icon:o.mRM})]}),(0,R.jsx)(c.A,{anchorEl:X,open:Boolean(X),onClose:()=>ne(null),children:(0,R.jsx)(d.A,{onClick:()=>ne("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===V,children:"Accessories"})})]}),(0,R.jsxs)("div",{className:"filters",children:[(0,R.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>W(e.currentTarget),children:["Sort By\xa0",(0,R.jsx)(i.g,{icon:o.OM7})]}),(0,R.jsxs)(c.A,{anchorEl:Q,open:Boolean(Q),onClose:()=>se(null),children:[(0,R.jsx)(d.A,{onClick:()=>se("updated_at"),selected:"updated_at"===q,children:"Sort by CP"}),(0,R.jsx)(d.A,{onClick:()=>se("price"),selected:"price"===q,children:"Sort by Price"})]})]})]}),P?(0,R.jsx)(l.A,{sx:{textAlign:"center",fontStyle:"italic",color:"text.secondary"},children:"No Loans Found"}):(0,R.jsxs)(T,{children:[G&&(0,R.jsx)(S.default,{selectedCreator:U,modalIsOpen:G,closeModal:()=>J(!1)}),ie.map((r=>{var t;if(null===(t=r.owners)||void 0===t||!t.length)return null;const n=r.owners[0];"FRACTIONAL"===r.loan_type?r.fractional_amount:r.loan_amount;return(0,R.jsxs)(L,{onClick:()=>{e((0,v.ce)(r._id)),e((0,v.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price}))},children:[(0,R.jsx)(l.A,{sx:{position:"relative",flex:1,display:"flex",alignItems:"center",justifyContent:"center"},children:r.owners.map((e=>(0,R.jsx)(l.A,{sx:{position:"absolute",top:8,left:8},children:B[e.user]?(0,R.jsx)(l.A,{component:"a",onClick:r=>{r.stopPropagation(),r.preventDefault(),$(B[e.user]._id),J(!0)},className:"player",children:(0,R.jsx)(C.A,{user_id:B[e.user]._id,src:B[e.user].avatar,rank:B[e.user].totalWagered,accessory:B[e.user].accessory,alt:"",username:B[e.user].username,darkMode:D})}):(0,R.jsx)(u.A,{variant:"circular",width:40,height:40})},e.user)))}),(0,R.jsxs)(l.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,R.jsxs)(l.A,{children:[(0,R.jsx)(x.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,R.jsx)(p.A,{children:(0,R.jsx)(f.A,{size:"small","aria-label":"loan-details-table",children:(0,R.jsxs)(h.A,{children:[(0,R.jsxs)(m.A,{children:[(0,R.jsxs)(A.A,{sx:{color:"#bbb"},children:[(0,R.jsx)(i.g,{icon:o._2z})," ",n.rentOption?"Price / month":"Price / unit",":"]}),(0,R.jsx)(A.A,{sx:{color:"#ff8500"},children:(0,k.a)(n.price,Y)})]}),(0,R.jsxs)(m.A,{children:[(0,R.jsxs)(A.A,{sx:{color:"#bbb"},children:[(0,R.jsx)(i.g,{icon:o.kwR})," Quantity:"]}),(0,R.jsxs)(A.A,{sx:{color:"#ff8500"},children:[n.onSale," / ",r.total_count]})]})]})})})]}),(0,R.jsx)(l.A,{sx:{textAlign:"right",mt:1},children:(0,R.jsx)(Tooltip,{title:n.rentOption?"Rent":"Trade",children:(0,R.jsx)(a.A,{variant:"contained",color:"error",startIcon:(0,R.jsx)(g.A,{}),onClick:t=>{if(t.stopPropagation(),e((0,v.ce)(r._id)),e((0,v.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price})),n.user!==z)if(r.showConfirmationModal){const t=window.confirm(r.message);e(t?(0,b.Gu)(n.rentOption?"rent":"trade"):(0,b.NX)("TRADE ACTION CANCELLED,PUSSY-ED OUT"))}else e((0,b.Gu)(n.rentOption?"rent":"trade"));else e((0,b.NX)("THIS IS LITERALLY YOURS ALREADY!"))},children:n.rentOption?"Rent":"Trade"})})})]})]},`${r._id}-${n.user}`)}))]}),!P&&(0,R.jsx)(I,{children:(0,R.jsx)(j.A,{page:M,count:s,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,v.Se)(100,t,q,V))}})})]})}),G&&(0,R.jsx)(S.default,{selectedCreator:U,modalIsOpen:G,closeModal:()=>J(!1)})]})}),P=()=>(0,R.jsx)(M,{})}}]);
//# sourceMappingURL=4636.4dced49b.chunk.js.map