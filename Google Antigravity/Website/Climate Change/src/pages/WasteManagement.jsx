import React from 'react';
import WasteManagementHero from '../sections/WasteManagementHero';
import WasteManagementBenefits from '../sections/WasteManagementBenefits';
import WasteManagementMethods from '../sections/WasteManagementMethods';
import FadeInSection from '../components/FadeInSection';

const WasteManagement = () => {
    return (
        <>
            <WasteManagementHero />
            <FadeInSection>
                <WasteManagementBenefits />
            </FadeInSection>
            <FadeInSection>
                <WasteManagementMethods />
            </FadeInSection>
        </>
    );
};

export default WasteManagement;
