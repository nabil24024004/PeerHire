import { SVGProps } from "react";

// Custom Taka icon since lucide-react doesn't have one
export const TakaIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill="currentColor"
            stroke="none"
        >
            ৳
        </text>
    </svg>
);
