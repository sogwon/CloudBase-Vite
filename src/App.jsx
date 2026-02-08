import { useState } from 'react'
import { cloudbase } from './cloudbase'
import './App.css'

function App() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [tableData, setTableData] = useState(null) // { tableName, columns, rows }
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState(null)

  const checkConnection = async () => {
    setConnectionStatus('checking')
    setError(null)
    try {
      // CloudBase SDK 초기화 후 mysql 또는 callFunction으로 연결 확인
      if (cloudbase && cloudbase.mysql) {
        setConnectionStatus('connected')
        return true
      }
      setConnectionStatus('error')
      setError('CloudBase MySQL 클라이언트를 사용할 수 없습니다.')
      return false
    } catch (err) {
      setConnectionStatus('error')
      setError(err?.message || '연결 확인 실패')
      return false
    }
  }

  const fetchTableList = async () => {
    setLoading(true)
    setError(null)
    setTables([])
    try {
      // Cloud Function 'getTableList' 호출 (MySQL 테이블 목록은 서버 전용 runSQL로만 조회 가능)
      const res = await cloudbase.callFunction({
        name: 'getTableList',
        data: {},
      })
      const result = res?.result
      if (result?.code === 0 && Array.isArray(result?.data?.tables)) {
        setTables(result.data.tables)
      } else if (result?.error) {
        setError(result.error)
      } else if (result?.code !== undefined && result?.code !== 0) {
        setError(result.message || '테이블 목록 조회 실패')
      } else {
        // Cloud Function이 없거나 다른 형식의 응답
        setError(
          'getTableList Cloud Function이 배포되지 않았거나 응답 형식이 다릅니다. ' +
            'cloudfunctions/getTableList 폴더의 함수를 CloudBase에 배포해 주세요.'
        )
      }
    } catch (err) {
      const msg = err?.message || String(err)
      if (msg.includes('NOT_FOUND') || msg.includes('function') || msg.includes('404')) {
        setError(
          'getTableList Cloud Function을 찾을 수 없습니다. ' +
            'cloudfunctions/getTableList 코드를 CloudBase 콘솔에서 배포해 주세요.'
        )
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchTableData = async (tableName) => {
    setDataLoading(true)
    setDataError(null)
    setTableData(null)
    try {
      const res = await cloudbase.callFunction({
        name: 'getTableData',
        data: { tableName },
      })
      const result = res?.result
      if (result?.code === 0 && result?.data) {
        setTableData(result.data)
      } else if (result?.error) {
        setDataError(result.error)
      } else {
        setDataError(
          'getTableData Cloud Function이 배포되지 않았거나 응답 형식이 다릅니다. ' +
            'cloudfunctions/getTableData 폴더를 CloudBase에 배포해 주세요.'
        )
      }
    } catch (err) {
      const msg = err?.message || String(err)
      setDataError(
        msg.includes('NOT_FOUND') || msg.includes('function')
          ? 'getTableData Cloud Function을 찾을 수 없습니다. cloudfunctions/getTableData를 배포해 주세요.'
          : msg
      )
    } finally {
      setDataLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>CloudBase + MySQL 테이블 목록</h1>
        <p className="subtitle">Tencent CloudBase 웹앱 — MySQL 테이블 조회</p>
      </header>

      <section className="section">
        <h2>연결 상태</h2>
        <p>
          환경: <code>{import.meta.env.VITE_CLOUDBASE_ENV_ID || '(설정 필요)'}</code>
          {' · '}
          리전: <code>{import.meta.env.VITE_CLOUDBASE_REGION || '-'}</code>
        </p>
        <button onClick={checkConnection} disabled={connectionStatus === 'checking'}>
          {connectionStatus === 'checking'
            ? '확인 중...'
            : connectionStatus === 'connected'
              ? '연결됨'
              : '연결 확인'}
        </button>
        {connectionStatus === 'connected' && (
          <span className="status-badge connected">CloudBase SDK 사용 가능</span>
        )}
      </section>

      <section className="section">
        <h2>MySQL 테이블 목록</h2>
        <p className="hint">
          테이블 목록은 서버 전용 API이므로 Cloud Function <code>getTableList</code>를 통해 조회합니다.
        </p>
        <button onClick={fetchTableList} disabled={loading}>
          {loading ? '조회 중...' : '테이블 목록 조회'}
        </button>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}

        {tables.length > 0 && (
          <div className="table-list">
            <h3>테이블 ({tables.length}개) — 클릭하면 데이터 미리보기</h3>
            <ul>
              {tables.map((name, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="table-name-btn"
                    onClick={() => fetchTableData(name)}
                    disabled={dataLoading}
                  >
                    <code>{name}</code>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {(dataLoading || tableData || dataError) && (
        <section className="section data-preview">
          <h2>테이블 데이터 미리보기</h2>
          {dataLoading && <p>조회 중...</p>}
          {dataError && <div className="message error">{dataError}</div>}
          {tableData && !dataLoading && (
            <div className="data-table-wrap">
              <h3>
                <code>{tableData.tableName}</code> (최대 {tableData.rows?.length ?? 0}행)
              </h3>
              {tableData.rows?.length === 0 ? (
                <p className="empty">데이터가 없습니다.</p>
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {(tableData.columns || []).map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(tableData.rows || []).map((row, ri) => (
                        <tr key={ri}>
                          {(tableData.columns || []).map((col) => (
                            <td key={col}>
                              {row[col] == null ? '—' : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <footer className="footer">
        <p>
          <a href="https://docs.cloudbase.net/en/api-reference/webv2/initialization" target="_blank" rel="noopener noreferrer">
            CloudBase JS SDK V2 문서
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
