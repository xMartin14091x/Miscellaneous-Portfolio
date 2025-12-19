import React from 'react';
import WaterFiltrationHero from '../sections/WaterFiltrationHero';
import WaterFiltrationBenefits from '../sections/WaterFiltrationBenefits';
import WaterFiltrationMethods from '../sections/WaterFiltrationMethods';
import FadeInSection from '../components/FadeInSection';

const WaterFiltration = () => {
    return (
        <>
            <WaterFiltrationHero />
            <FadeInSection>
                <WaterFiltrationBenefits />
            </FadeInSection>
            <FadeInSection>
                <WaterFiltrationMethods />
            </FadeInSection>
        </>
    );
};

export default WaterFiltration;
