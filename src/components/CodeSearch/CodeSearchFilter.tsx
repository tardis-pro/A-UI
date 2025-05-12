import React from 'react';

interface CodeSearchFilterProps {
    onLanguageChange: (language: string) => void;
    onPythonAnalysisChange: (enabled: boolean) => void;
    isPythonAnalysisEnabled: boolean;
}

const CodeSearchFilter: React.FC<CodeSearchFilterProps> = ({ onLanguageChange, onPythonAnalysisChange, isPythonAnalysisEnabled }) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onLanguageChange(event.target.value);
    };

    const handlePythonAnalysisChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onPythonAnalysisChange(event.target.checked);
    };

    return (
        <div>
            <label htmlFor="language">Language:</label>
            <select id="language" onChange={handleChange}>
                <option value="">All</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
            </select>

            <label>
                Analyze Python Code:
                <input
                    type="checkbox"
                    checked={isPythonAnalysisEnabled}
                    onChange={handlePythonAnalysisChange}
                />
            </label>
        </div>
    );
};

export default CodeSearchFilter;