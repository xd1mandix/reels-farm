import{ay as o,B as e,M as t,az as l,I as d,aA as c,aB as h,aj as i}from"./strapi-BpsLP0DD.js";const g=({label:s,isSibling:r=!1})=>{const n=o();return e.jsxs(x,{background:r?"neutral100":"primary100",display:"inline-flex",gap:3,hasRadius:!0,justifyContent:"space-between",$isSibling:r,"max-height":"3.2rem",maxWidth:"min-content",children:[e.jsxs(t,{gap:3,children:[n&&e.jsx(p,{alignItems:"center",cursor:"all-scroll",padding:3,children:e.jsx(l,{})}),e.jsx(d,{textColor:r?void 0:"primary600",fontWeight:"bold",ellipsis:!0,maxWidth:"7.2rem",children:s})]}),e.jsxs(t,{children:[e.jsx(a,{alignItems:"center",children:e.jsx(c,{})}),e.jsx(a,{alignItems:"center",children:e.jsx(h,{})})]})]})},a=i(t)`
  height: ${({theme:s})=>s.spaces[7]};

  &:last-child {
    padding: 0 ${({theme:s})=>s.spaces[3]};
  }
`,p=i(a)`
  border-right: 1px solid ${({theme:s})=>s.colors.primary200};

  svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`,x=i(t)`
  border: 1px solid
    ${({theme:s,$isSibling:r})=>r?s.colors.neutral150:s.colors.primary200};

  svg {
    width: 1rem;
    height: 1rem;

    path {
      fill: ${({theme:s,$isSibling:r})=>r?void 0:s.colors.primary600};
    }
  }
`;export{g as C};
