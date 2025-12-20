import { Helmet } from 'react-helmet-async';
import { BuilderLayout } from '@/features/builder/views/BuilderLayout';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>PageBuilder - Drag & Drop HTML Page Builder</title>
        <meta name="description" content="Build beautiful landing pages, about pages, news and events pages with our intuitive drag and drop builder. No coding required." />
      </Helmet>
      <BuilderLayout />
    </>
  );
};

export default Index;
