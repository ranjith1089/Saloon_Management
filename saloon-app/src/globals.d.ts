// Silence TS for CSS side-effect / module imports used by the web build.
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
