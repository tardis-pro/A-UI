import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeSearchInputProps {
    onSearch: (query: string) => void;
    onSearchSubmit: () => void;
}

const CodeSearchInput: React.FC<CodeSearchInputProps> = ({ onSearch, onSearchSubmit }) => {
    const [searchText, setSearchText] = React.useState('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(event.target.value);
        onSearch(event.target.value);
    };

    const handleSubmit = () => {
        onSearchSubmit();
    };

    return (
        <div>
            <input
                type="text"
                value={searchText}
                onChange={handleChange}
                placeholder="Search code..."
            />
            <button onClick={handleSubmit}>Search</button>
            {/* <SyntaxHighlighter language="javascript" style={dracula}>
                {searchText}
              </SyntaxHighlighter> */}
        </div>
    );
};

export default CodeSearchInput;