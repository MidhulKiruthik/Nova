# AI Rules for Nova+ Application Development

This document outlines the core technologies used in the Nova+ application and provides clear guidelines on which libraries to use for specific functionalities. Adhering to these rules ensures consistency, maintainability, and efficient development.

## Tech Stack Overview

1.  **React & Next.js**: The application is built using React for the user interface, leveraging Next.js for server-side rendering, routing, and API routes.
2.  **TypeScript**: All application code is written in TypeScript, ensuring type safety and improving code quality.
3.  **Tailwind CSS**: Styling is handled exclusively with Tailwind CSS, providing a utility-first approach for responsive and consistent design.
4.  **shadcn/ui**: A collection of beautifully designed, accessible, and customizable UI components built with Radix UI and Tailwind CSS.
5.  **Radix UI**: The foundational unstyled component library used by shadcn/ui for building accessible and robust UI primitives.
6.  **Recharts**: A composable charting library used for all data visualization and graphical representations.
7.  **Lucide React**: A library providing a set of beautiful and customizable SVG icons.
8.  **React Hook Form & Zod**: Used for efficient form management and schema-based validation.
9.  **`sonner`**: A modern toast notification library for displaying user feedback.
10. **`xlsx`**: A library for reading, writing, and manipulating Excel (and other spreadsheet) files.

## Library Usage Rules

*   **UI Components**: Always prioritize `shadcn/ui` components for building the user interface. If a specific component is not available or requires significant customization beyond what `shadcn/ui` offers, create a new component in `src/components/` and style it using Tailwind CSS. **Do not modify existing `shadcn/ui` component files directly.**
*   **Styling**: Use Tailwind CSS for all styling. Avoid inline styles or other CSS frameworks. Ensure designs are responsive by default.
*   **Icons**: Use icons from the `lucide-react` library.
*   **Forms & Validation**: Implement all forms using `react-hook-form` for state management and `zod` for schema validation.
*   **Charting & Data Visualization**: Use `recharts` for all graphs, charts, and data visualizations.
*   **Date Pickers**: Use `react-day-picker` for any date selection functionalities.
*   **Toast Notifications**: Use `sonner` for displaying all types of toast notifications (success, error, loading, etc.).
*   **Excel Operations**: For reading, writing, or downloading Excel files, use the `xlsx` library and the utility functions provided in `lib/excel-utils.ts`.
*   **Carousels**: Use `embla-carousel-react` for any carousel or slider implementations.
*   **Drawers**: Use `vaul` for creating accessible and customizable drawer components.
*   **Theme Management**: Use `next-themes` for handling dark/light mode toggling.
*   **State Management**: For local component state, use React's `useState` and `useReducer`. For global or shared application data, leverage the existing `dataStore` utility in `lib/data-store.ts` or create new React Context/hooks for feature-specific global state.
*   **Routing**: Utilize Next.js's file-system based routing for all navigation within the application.