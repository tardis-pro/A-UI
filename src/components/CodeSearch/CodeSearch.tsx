import React from 'react';
import CodeSearchInput from './CodeSearchInput';
import CodeSearchResult from './CodeSearchResult';
import CodeSearchFilter from './CodeSearchFilter';
import { searchCode } from '../../services/api';

interface CodeSearchResultType {
  code: string;
  language: string;
  analysis?: string; // Optional analysis property
}

const CodeSearch: React.FC = () => {
  const [searchResults, setSearchResults] = React.useState<CodeSearchResultType[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [languageFilter, setLanguageFilter] = React.useState('');
  const [isPythonAnalysisEnabled, setIsPythonAnalysisEnabled] = React.useState(false);

  const handleSearch = async () => {
    let results = await searchCode(searchQuery, languageFilter);

    if (isPythonAnalysisEnabled) {
      // Assuming the API returns an array of code snippets
      results = await Promise.all(
        results.map(async (result) => {
          const response = await fetch('/api/code/analyze_code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: result.code }), // Pass the code property
          });
          const data = await response.json();
          return { ...result, analysis: data.analysis }; // Assuming the API returns { analysis: ... }
        })
      );
    }

    setSearchResults(results);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleLanguageFilterChange = (language: string) => {
    setLanguageFilter(language);
  };

  return (
    <div>
      <h1>Code Search</h1>
      <CodeSearchInput onSearch={handleSearchQueryChange} onSearchSubmit={handleSearch} />
      <CodeSearchFilter
        onLanguageChange={handleLanguageFilterChange}
        onPythonAnalysisChange={setIsPythonAnalysisEnabled} // Pass the state setter
        isPythonAnalysisEnabled={isPythonAnalysisEnabled} // Pass the state value
      />
      {searchResults.map((result, index) => (
        <CodeSearchResult key={index} code={result.code} language={result.language} analysis={result.analysis} searchQuery={searchQuery} />
      ))}
    </div>
  );
};

export default CodeSearch;