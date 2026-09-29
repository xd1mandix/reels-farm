import{fT as C,q as o,fU as j,B as e,aR as P,aS as w,P as E,bM as L,I as p,T as N,U as A,J as S,aj as s}from"./strapi-DYgy_QPR.js";var D=function(t){console.error(t)},I=function(t){console.warn(t)},R={formats:{},messages:{},timeZone:void 0,defaultLocale:"en",defaultFormats:{},fallbackOnEmptyString:!0,onError:D,onWarn:I};function O(t,a,n){if(n===void 0&&(n=Error),!t)throw new n(a)}function B(t){O(t,"[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.")}C(C({},R),{textComponent:o.Fragment});var v=typeof window<"u"&&!window.__REACT_INTL_BYPASS_GLOBAL_CONTEXT__?window.__REACT_INTL_CONTEXT__||(window.__REACT_INTL_CONTEXT__=o.createContext(null)):o.createContext(null);v.Consumer;v.Provider;var U=v;function T(){var t=o.useContext(U);return B(t),t}var h;(function(t){t.formatDate="FormattedDate",t.formatTime="FormattedTime",t.formatNumber="FormattedNumber",t.formatList="FormattedList",t.formatDisplayName="FormattedDisplayName"})(h||(h={}));var g;(function(t){t.formatDate="FormattedDateParts",t.formatTime="FormattedTimeParts",t.formatNumber="FormattedNumberParts",t.formatList="FormattedListParts"})(g||(g={}));function _(t){var a=function(n){var f=T(),l=n.value,c=n.children,d=j(n,["value","children"]),i=typeof l=="string"?new Date(l||0):l,m=t==="formatDate"?f.formatDateToParts(i,d):f.formatTimeToParts(i,d);return c(m)};return a.displayName=g[t],a}function x(t){var a=function(n){var f=T(),l=n.value,c=n.children,d=j(n,["value","children"]),i=f[t](l,d);if(typeof c=="function")return c(i);var m=f.textComponent||o.Fragment;return o.createElement(m,null,i)};return a.displayName=h[t],a}x("formatDate");x("formatTime");x("formatNumber");x("formatList");x("formatDisplayName");_("formatDate");_("formatTime");const V="1.0.0",k=s.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: auto;
  margin-top: 80px;
`,z=s.div`
  background: #212134;
  padding: 32px 48px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  width: 100%;
  text-align: center;
`,X=s.h1`
  font-size: 32px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24px;
`,q=s.div`
  height: 24px;
`,G=s.div`
  margin: 10px;
  font-size: 16px;
  color: #ffffff;
  text-align: center;
`,H=s.div`
  color: #ff4d4f;
  font-size: 16px;
  margin-top: 16px;
  text-align: center;
`,M=()=>window.location.hostname==="localhost"?"localhost":"production",W=()=>{const[t,a]=o.useState([]),[n,f]=o.useState(""),[l,c]=o.useState(!0),[d,i]=o.useState(null),[m,b]=o.useState("");o.useEffect(()=>{c(!0),fetch("/api/strapi-custom-action-perform-page/config").then(r=>r.json()).then(r=>{console.log("Fetched title:",r),b(r.title),c(!1),Array.isArray(r.downloadButtons)?a(r.downloadButtons):i("Failed to load data. Please try again later.")}).catch(r=>{console.error(r),i("An error occurred while fetching the data."),c(!1)})},[]);const F=()=>{if(!n)return;const r=M(),u=t.find(y=>y.label===n);u&&u.endpoints?.[r]?window.location.href=u.endpoints[r]:i("Selected option is invalid or no endpoint available.")};return e.jsx(k,{children:e.jsxs(z,{children:[e.jsx(X,{children:m||"Perform Action"}),l&&e.jsx(G,{children:"Loading..."}),d&&e.jsx(H,{children:d}),!l&&!d&&e.jsxs(e.Fragment,{children:[e.jsx(N,{label:"Select Enquiry Type",placeholder:"Choose an option",value:n,onChange:f,children:t.map((r,u)=>e.jsx(A,{value:r.label,children:r.label},u))}),e.jsx(q,{}),n&&t.find(r=>r.label===n)?.buttonText&&e.jsx(S,{onClick:F,children:t.find(r=>r.label===n).buttonText})]})]})})},K=s.div`
  background-color: #212134;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  margin-top: 300px; /* Reduced margin-top for better spacing */
  padding: 20px 40px;
  text-align: center; /* Center the footer text */
`,Y=s.a`
  color: white;
  text-decoration: none;

  &:hover {
    text-decoration: underline; /* Added hover effect for better UX */
  }
`,J=s.div`
  margin-top: 15px;
  color: #fff;
  font-size: 14px;
`,Z=()=>{const{formatMessage:t}=T();return e.jsxs(L,{children:[e.jsx(W,{}),e.jsxs(K,{children:[e.jsxs(p,{variant:"pi",textColor:"neutral600",style:{marginTop:"40px"},children:["By Uzair Sayyed"," "]}),e.jsxs(p,{variant:"pi",textColor:"neutral600",style:{marginTop:"10px"},children:["© ",new Date().getFullYear()," ",e.jsx(Y,{href:"https://nipralo.com",target:"_blank","aria-label":"Visit Nipralo Technologies",children:"Nipralo Technologies"})," ","All rights reserved."]}),e.jsx(J,{children:e.jsxs(p,{variant:"pi",textColor:"neutral600",children:["Version: ",V]})})]})]})},$=()=>e.jsxs(P,{children:[e.jsx(w,{index:!0,element:e.jsx(Z,{})}),e.jsx(w,{path:"*",element:e.jsx(E.Error,{})})]});export{$ as App};
