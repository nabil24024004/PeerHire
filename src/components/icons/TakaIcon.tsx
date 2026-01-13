import { SVGProps } from "react";

// Custom Taka icon since lucide-react doesn't have one
export const TakaIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <text
            x="12"
            y="18"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fontFamily="Arial, sans-serif"
        >
            ৳
        </text>
    </svg>
);
