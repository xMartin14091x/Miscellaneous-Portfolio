
import React from 'react';
import NuclearHero from '../sections/NuclearHero';
import NuclearBenefits from '../sections/NuclearBenefits';
import NuclearMethods from '../sections/NuclearMethods';
import FadeInSection from '../components/FadeInSection';

const NuclearPower = () => {
    return (
        <>
            <NuclearHero />
            <FadeInSection>
                <NuclearBenefits />
            </FadeInSection>
            <FadeInSection>
                <NuclearMethods />
            </FadeInSection>
        </>
    );
};

export default NuclearPower;
