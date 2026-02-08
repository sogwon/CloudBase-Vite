/**
 * CloudBase Cloud Function: MySQL 테이블 목록 조회
 * 웹앱에서 callFunction({ name: 'getTableList', data: {} })로 호출합니다.
 *
 * 배포: CloudBase 콘솔 > 云函数 > 新建 >  함수명 getTableList,
 *      코드 업로드 후 "保存并安装依赖" 실행
 */
const cloudbase = require('@cloudbase/node-sdk');

exports.main = async (event, context) => {
  try {
    // Cloud Function 환경에서는 env 생략 시 현재 환경 ID 사용
    const app = cloudbase.init({ context });
    const models = app.models;

    if (!models || typeof models.$runSQL !== 'function') {
      return {
        code: -1,
        error: '데이터 모델 또는 $runSQL을 사용할 수 없습니다. MySQL형 데이터베이스가 연결되어 있는지 확인하세요.',
      };
    }

    // information_schema에서 현재 DB의 테이블 목록 조회 (서버 전용 API)
    const result = await models.$runSQL(
      'SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY TABLE_NAME',
      {}
    );

    const data = result?.data || result;
    const executeResultList = data?.executeResultList;
    if (!executeResultList || !Array.isArray(executeResultList)) {
      return { code: 0, data: { tables: [] }, message: '테이블이 없거나 조회 결과가 비어 있습니다.' };
    }

    // executeResultList: 각 요소가 한 행 객체 (예: { TABLE_NAME: "users" })
    const tables = executeResultList
      .map((row) => (row && (row.TABLE_NAME != null ? row.TABLE_NAME : row.table_name)) || row)
      .filter((name) => typeof name === 'string' && name.length > 0);

    return { code: 0, data: { tables }, requestId: context?.requestId };
  } catch (err) {
    console.error('getTableList error:', err);
    return {
      code: -1,
      error: err?.message || String(err),
      requestId: context?.requestId,
    };
  }
};
