import React from 'react';

const ColorBlindFilters = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none', position: 'absolute', width: 0, height: 0 }}>
            <defs>
                {/* ═══ PROTANOPIA DALTONIZE (Red-Blind Correction) ═══ */}
                <filter id="protanopia-daltonize" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.56667 0.43333 0.00000 0 0
                            0.55833 0.44167 0.00000 0 0
                            0.00000 0.24167 0.75833 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                        result="sim"
                    />
                    <feComposite in="SourceGraphic" in2="sim" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0" result="error" />
                    <feColorMatrix
                        type="matrix"
                        in="error"
                        values="
                            0.0 0.0 0.0 0 0
                            0.7 1.0 0.0 0 0
                            0.7 0.0 1.0 0 0
                            0.0 0.0 0.0 1 0
                        "
                        result="error_corr"
                    />
                    <feComposite in="SourceGraphic" in2="error_corr" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                </filter>

                {/* ═══ DEUTERANOPIA DALTONIZE (Green-Blind Correction) ═══ */}
                <filter id="deuteranopia-daltonize" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.62500 0.37500 0.00000 0 0
                            0.70000 0.30000 0.00000 0 0
                            0.00000 0.30000 0.70000 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                        result="sim"
                    />
                    <feComposite in="SourceGraphic" in2="sim" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0" result="error" />
                    <feColorMatrix
                        type="matrix"
                        in="error"
                        values="
                            1.0 0.7 0.0 0 0
                            0.0 0.0 0.0 0 0
                            0.0 0.7 1.0 0 0
                            0.0 0.0 0.0 1 0
                        "
                        result="error_corr"
                    />
                    <feComposite in="SourceGraphic" in2="error_corr" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                </filter>

                {/* ═══ TRITANOPIA DALTONIZE (Blue-Blind Correction) ═══ */}
                <filter id="tritanopia-daltonize" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.95000 0.05000 0.00000 0 0
                            0.00000 0.43333 0.56667 0 0
                            0.00000 0.47500 0.52500 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                        result="sim"
                    />
                    <feComposite in="SourceGraphic" in2="sim" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0" result="error" />
                    <feColorMatrix
                        type="matrix"
                        in="error"
                        values="
                            1.0 0.0 0.7 0 0
                            0.0 1.0 0.7 0 0
                            0.0 0.0 0.0 0 0
                            0.0 0.0 0.0 1 0
                        "
                        result="error_corr"
                    />
                    <feComposite in="SourceGraphic" in2="error_corr" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                </filter>

                {/* ═══ PROTANOPIA SIMULATION ═══ */}
                <filter id="protanopia-sim" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.56667 0.43333 0.00000 0 0
                            0.55833 0.44167 0.00000 0 0
                            0.00000 0.24167 0.75833 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                    />
                </filter>

                {/* ═══ PROTANOMALY SIMULATION ═══ */}
                <filter id="protanomaly-sim" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.81667 0.18333 0.00000 0 0
                            0.33333 0.66667 0.00000 0 0
                            0.00000 0.12500 0.87500 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                    />
                </filter>

                {/* ═══ DEUTERANOPIA SIMULATION ═══ */}
                <filter id="deuteranopia-sim" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.62500 0.37500 0.00000 0 0
                            0.70000 0.30000 0.00000 0 0
                            0.00000 0.30000 0.70000 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                    />
                </filter>

                {/* ═══ DEUTERANOMALY SIMULATION ═══ */}
                <filter id="deuteranomaly-sim" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.80000 0.20000 0.00000 0 0
                            0.25833 0.74167 0.00000 0 0
                            0.00000 0.14167 0.85833 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                    />
                </filter>

                {/* ═══ TRITANOPIA SIMULATION ═══ */}
                <filter id="tritanopia-sim" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.95000 0.05000 0.00000 0 0
                            0.00000 0.43333 0.56667 0 0
                            0.00000 0.47500 0.52500 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                    />
                </filter>

                {/* ═══ TRITANOMALY SIMULATION ═══ */}
                <filter id="tritanomaly-sim" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.96667 0.03333 0.00000 0 0
                            0.00000 0.73333 0.26667 0 0
                            0.00000 0.18333 0.81667 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                    />
                </filter>

                {/* ═══ ACHROMATOPSIA (Total Color Blindness) ═══ */}
                <filter id="achromatopsia" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.29900 0.58700 0.11400 0 0
                            0.29900 0.58700 0.11400 0 0
                            0.29900 0.58700 0.11400 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                    />
                </filter>

                {/* ═══ ACHROMATOMALY (Partial Color Blindness) ═══ */}
                <filter id="achromatomaly" colorInterpolationFilters="linearRGB">
                    <feColorMatrix
                        type="matrix"
                        in="SourceGraphic"
                        values="
                            0.61800 0.32000 0.06200 0 0
                            0.16300 0.77500 0.06200 0 0
                            0.16300 0.32000 0.51600 0 0
                            0.00000 0.00000 0.00000 1 0
                        "
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default ColorBlindFilters;
