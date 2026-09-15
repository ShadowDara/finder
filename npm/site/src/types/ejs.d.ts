declare module "ejs" {
  const ejs: {
    render: (template: string, data?: any, options?: { filename?: string }) => string;
  };

  export default ejs;
}
