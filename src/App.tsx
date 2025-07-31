import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import axios from "axios";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectCount, setSelectCount] = useState<string>("");
  const rowsPerPage = 12;

  const op = useRef<OverlayPanel>(null);

  const fetchArtworks = async (page: number) => {
    try {
      const response = await axios.get<ApiResponse>(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      setArtworks(response.data.data);
      setTotalRecords(response.data.pagination.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchArtworks(currentPage);
  }, [currentPage]);

  const onPageChange = (event: any) => {
    const nextPage = event.page ?? 0;
    setCurrentPage(nextPage + 1);
  };


  const onSelectionChange = (e: { value: Artwork[] }) => {
    const currentPageIds = new Set(artworks.map((a) => a.id));
    const newPageSelectionIds = new Set(e.value.map((a) => a.id));

    const updated = selectedArtworks.filter(
      (art) => !currentPageIds.has(art.id) || newPageSelectionIds.has(art.id) 
    );

    for (const art of e.value) {
      if (!updated.find((a) => a.id === art.id)) {
        updated.push(art);
      }
    }

    setSelectedArtworks(updated);
  };


  const toggleOverlay = (e: React.MouseEvent) => {
    op.current?.toggle(e);
  };

  const handleSelectTopN = async () => {
    const count = parseInt(selectCount, 10);
    if (isNaN(count) || count <= 0) return;

    const pagesNeeded = Math.ceil(count / rowsPerPage);
    const fetchedArtworks: Artwork[] = [];

    for (let i = 1; i <= pagesNeeded; i++) {
      try {
        const response = await axios.get<ApiResponse>(
          `https://api.artic.edu/api/v1/artworks?page=${i}`
        );
        fetchedArtworks.push(...response.data.data);
      } catch (err) {
        console.error("Error fetching page " + i, err);
        break;
      }
    }

    const newSelection = [...selectedArtworks];
    const alreadySelectedIds = new Set(newSelection.map((art) => art.id));

    let added = 0;
    for (const art of fetchedArtworks) {
      if (!alreadySelectedIds.has(art.id)) {
        newSelection.push(art);
      }
      added++;
      if (added === count) break;
    }

    setSelectedArtworks(newSelection);
    op.current?.hide();
  };


  const checkboxHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <i
        className="pi pi-chevron-down"
        onClick={toggleOverlay}
        style={{
          cursor: "pointer",
          fontSize: "1rem",
          color: "#555",
        }}
      />
      <OverlayPanel ref={op}>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <InputText
            value={selectCount}
            onChange={(e) => setSelectCount(e.target.value)}
            placeholder="Number of rows"
            keyfilter="int"
          />
          <Button label="Select Rows" onClick={handleSelectTopN} />
        </div>
      </OverlayPanel>
    </div>
  );

  return (
    <div style={{ padding: "2rem", borderRadius: "10px" }}>
      <div className="card">
        <DataTable<Artwork>
          value={artworks}
          paginator
          rows={rowsPerPage}
          totalRecords={totalRecords}
          lazy
          first={(currentPage - 1) * rowsPerPage}
          onPage={onPageChange}
          // selection={selectedArtworks}
          selection={artworks.filter((art) =>
            selectedArtworks.some((sel) => sel.id === art.id)
          )}
          onSelectionChange={onSelectionChange}
          dataKey="id"
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          <Column header={checkboxHeader} />
          <Column field="title" header="Title" />
          <Column field="place_of_origin" header="Place of Origin" />
          <Column field="artist_display" header="Artist" />
          <Column field="inscriptions" header="Inscriptions" />
          <Column field="date_start" header="Start Date" />
          <Column field="date_end" header="End Date" />
        </DataTable>
      </div>
    </div>
  );
};

export default App;
