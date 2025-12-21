import { Helmet } from 'react-helmet-async';
import { BuilderLayout } from '@/features/builder/views/BuilderLayout';
import { AppProvider, AppState } from '@/features';

const Index = () => {
    // Initialize theme on mount
    AppState.theme.init();

    return (
        <AppProvider value={AppState}>
            <Helmet>
                <title>PageBuilder - Drag & Drop HTML Page Builder</title>
                <meta name="description"
                    content="Build beautiful landing pages, about pages, news and events pages with our intuitive drag and drop builder. No coding required." />
            </Helmet>
            <BuilderLayout />
        </AppProvider>
    );
};

export default Index;
