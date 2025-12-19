import React from 'react';
import COEmissionsHero from '../sections/COEmissionsHero';
import COEmissionsBenefits from '../sections/COEmissionsBenefits';
import COEmissionsMethods from '../sections/COEmissionsMethods';
import FadeInSection from '../components/FadeInSection';

const COEmissions = () => {
    return (
        <>
            <COEmissionsHero />
            <FadeInSection>
                <COEmissionsBenefits />
            </FadeInSection>
            <FadeInSection>
                <COEmissionsMethods />
            </FadeInSection>
        </>
    );
};

export default COEmissions;
