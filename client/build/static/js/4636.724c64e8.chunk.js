"use strict";(self.webpackChunkclient=self.webpackChunkclient||[]).push([[4636],{4636:(e,r,t)=>{t.r(r),t.d(r,{default:()=>D});var n=t(65043),s=t(1529),i=(t(86178),t(92127)),o=t(12639),l=t(30815),a=t(42518),c=t(688),d=t(32143),u=t(78185),x=t(94496),p=t(79650),f=t(71806),h=t(73460),m=t(28076),A=t(10039),j=t(18483),g=t(59135),y=t(31973),v=t(22166),w=t(28104),b=t(74458),C=t(95575),S=t(60916),k=t(57498),O=t(29777),N=t(6354),R=t(83034),_=t(70579);const E=s.Ay.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  width: 100%;
`,T=s.Ay.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`,I=s.Ay.div`
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
`,L=s.Ay.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`,M=s.Ay.div`
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
`,P=(s.Ay.div`
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
`,()=>{const e=(0,v.wA)(),r=(0,R.T)((0,v.d4)((e=>e.auth.isDarkMode))?"dark":"light"),t=(0,v.d4)((e=>e.itemReducer.itemArray)),s=(0,v.d4)((e=>e.itemReducer.pages)),P=(0,v.d4)((e=>e.itemReducer.page)),D=(0,v.d4)((e=>e.itemReducer.loading)),z=(0,v.d4)((e=>e.auth.isDarkMode)),Y=(0,v.d4)((e=>e.auth.user)),B=(0,v.d4)((e=>e.logic.solPrice)),[F,G]=((0,v.d4)((e=>e.auth.isLowGraphics)),(0,n.useState)({})),[J,U]=(0,n.useState)(!1),[$,X]=(0,n.useState)(""),[H,Q]=(0,n.useState)(null),[W,q]=(0,n.useState)(null),[K,V]=(0,n.useState)("updated_at"),[Z,ee]=(0,n.useState)("653ee81117c9f5ee2124564b"),re=(0,n.useRef)(JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]));(0,n.useEffect)((()=>{const e=re.current,r=JSON.stringify((null===t||void 0===t?void 0:t.owners)||[]);e!==r&&(te(),re.current=r)})),(0,n.useEffect)((()=>{te()}),[]),(0,n.useEffect)((()=>{t&&t.length>0&&ne()}),[t,e]);const te=function(){let r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:K,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:Z;e((0,w.Se)(100,P,r,t))},ne=async()=>{if(t)for(const n of t)if(n.owners&&n.owners.length>0)for(const t of n.owners)if(!F[t.user])try{const r=await e((0,b.Jx)(t.user));G((e=>({...e,[t.user]:r||{username:"Anon",avatar:"default-avatar-url"}})))}catch(r){console.error(`Error fetching customer info for ${t.user}:`,r)}},se=e=>{Q(null),e&&(ee(e),te(K,e))},ie=e=>{q(null),e&&(V(e),te(e,Z))},oe=t?[...t].sort(((e,r)=>{const t=e[K],n=r[K];return"asc"===K?t-n:n-t})):[];return(0,_.jsxs)(N.A,{theme:r,children:[(0,_.jsx)(l.A,{sx:{background:"#080808",borderRadius:"0.3em",p:"20px"},children:(0,_.jsxs)(E,{children:[(0,_.jsxs)(T,{children:[(0,_.jsxs)("div",{className:"filters",children:[(0,_.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>Q(e.currentTarget),children:["Filter\xa0",(0,_.jsx)(i.g,{icon:o.mRM})]}),(0,_.jsx)(c.A,{anchorEl:H,open:Boolean(H),onClose:()=>se(null),children:(0,_.jsx)(d.A,{onClick:()=>se("653ee81117c9f5ee2124564b"),selected:"653ee81117c9f5ee2124564b"===Z,children:"Accessories"})})]}),(0,_.jsxs)("div",{className:"filters",children:[(0,_.jsxs)(a.A,{color:"error",variant:"outlined",onClick:e=>q(e.currentTarget),children:["Sort By\xa0",(0,_.jsx)(i.g,{icon:o.OM7})]}),(0,_.jsxs)(c.A,{anchorEl:W,open:Boolean(W),onClose:()=>ie(null),children:[(0,_.jsx)(d.A,{onClick:()=>ie("updated_at"),selected:"updated_at"===K,children:"Sort by CP"}),(0,_.jsx)(d.A,{onClick:()=>ie("price"),selected:"price"===K,children:"Sort by Price"})]})]})]}),D?(0,_.jsx)(l.A,{sx:{textAlign:"center",fontStyle:"italic",color:"text.secondary"},children:"No Loans Found"}):(0,_.jsxs)(I,{children:[J&&(0,_.jsx)(k.default,{selectedCreator:$,modalIsOpen:J,closeModal:()=>U(!1)}),oe.map((r=>{var t;if(null===(t=r.owners)||void 0===t||!t.length)return null;const n=r.owners[0];"FRACTIONAL"===r.loan_type?r.fractional_amount:r.loan_amount;return(0,_.jsxs)(M,{onClick:()=>{e((0,w.ce)(r._id)),e((0,w.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price}))},children:[(0,_.jsx)(l.A,{sx:{position:"relative",flex:1,display:"flex",alignItems:"center",justifyContent:"center"},children:r.owners.map((e=>(0,_.jsx)(l.A,{sx:{position:"absolute",top:8,left:8},children:F[e.user]?(0,_.jsx)(l.A,{component:"a",onClick:r=>{r.stopPropagation(),r.preventDefault(),X(F[e.user]._id),U(!0)},className:"player",children:(0,_.jsx)(S.A,{user_id:F[e.user]._id,src:F[e.user].avatar,rank:F[e.user].totalWagered,accessory:F[e.user].accessory,elite:F[e.user].elite,alt:"",username:F[e.user].username,darkMode:z})}):(0,_.jsx)(u.A,{variant:"circular",width:40,height:40})},e.user)))}),(0,_.jsxs)(l.A,{sx:{flex:1,p:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,_.jsxs)(l.A,{children:[(0,_.jsx)(x.A,{variant:"h6",sx:{fontSize:"1rem",color:"#fff",textAlign:"center"},children:r.productName}),(0,_.jsx)(p.A,{children:(0,_.jsx)(f.A,{size:"small","aria-label":"loan-details-table",children:(0,_.jsxs)(h.A,{children:[(0,_.jsxs)(m.A,{children:[(0,_.jsxs)(A.A,{sx:{color:"#bbb"},children:[(0,_.jsx)(i.g,{icon:o._2z})," ",n.rentOption?"Price / month":"Price / unit",":"]}),(0,_.jsx)(A.A,{sx:{color:"#ff8500"},children:(0,O.a)(n.price,B)})]}),(0,_.jsxs)(m.A,{children:[(0,_.jsxs)(A.A,{sx:{color:"#bbb"},children:[(0,_.jsx)(i.g,{icon:o.kwR})," Quantity:"]}),(0,_.jsxs)(A.A,{sx:{color:"#ff8500"},children:[n.onSale," / ",r.total_count]})]})]})})})]}),(0,_.jsx)(l.A,{sx:{textAlign:"right",mt:1},children:(0,_.jsx)(j.A,{title:n.rentOption?"Rent":"Trade",children:(0,_.jsx)(a.A,{variant:"outlined",color:"error",startIcon:(0,_.jsx)(y.A,{}),onClick:t=>{if(t.stopPropagation(),e((0,w.ce)(r._id)),e((0,w.dd)({owner:n.user,productName:r.productName,rentOption:n.rentOption,price:n.price})),n.user!==Y)if(r.showConfirmationModal){const t=window.confirm(r.message);e(t?(0,C.Gu)(n.rentOption?"rent":"trade"):(0,C.NX)("TRADE ACTION CANCELLED,PUSSY-ED OUT"))}else e((0,C.Gu)(n.rentOption?"rent":"trade"));else e((0,C.NX)("THIS IS LITERALLY YOURS ALREADY!"))},children:n.rentOption?"Rent":"Trade"})})})]})]},`${r._id}-${n.user}`)}))]}),!D&&(0,_.jsx)(L,{children:(0,_.jsx)(g.A,{page:P,count:s,color:"error",sx:{"& .MuiPaginationItem-root":{borderRadius:"4px"}},onChange:(r,t)=>{e((0,w.Se)(100,t,K,Z))}})})]})}),J&&(0,_.jsx)(k.default,{selectedCreator:$,modalIsOpen:J,closeModal:()=>U(!1)})]})}),D=()=>(0,_.jsx)(P,{})}}]);
//# sourceMappingURL=4636.724c64e8.chunk.js.map