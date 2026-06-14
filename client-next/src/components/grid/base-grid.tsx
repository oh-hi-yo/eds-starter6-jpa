"use client";
import { AgGridReact, type AgGridReactProps } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

// ag-grid 35 Theming API：註冊一次社群模組。
ModuleRegistry.registerModules([AllCommunityModule]);

type Props<T> = AgGridReactProps<T> & { height?: number };

export function BaseGrid<T>({ height = 540, ...rest }: Props<T>) {
  return (
    <div style={{ height, width: "100%" }}>
      <AgGridReact<T>
        theme={themeQuartz}
        pagination
        paginationPageSize={20}
        paginationPageSizeSelector={[20, 50, 100]}
        animateRows
        {...rest}
      />
    </div>
  );
}
