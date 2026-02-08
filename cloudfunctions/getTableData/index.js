/**
 * CloudBase Cloud Function: 선택한 MySQL 테이블의 샘플 데이터 조회
 * 웹앱에서 callFunction({ name: 'getTableData', data: { tableName: 'users' } })로 호출
 */
const cloudbase = require('@cloudbase/node-sdk');

const MAX_ROWS = 20;
const TABLE_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

exports.main = async (event, context) => {
  try {
    const tableName = event?.tableName;
    if (!tableName || typeof tableName !== 'string') {
      return { code: -1, error: 'tableName이 필요합니다.' };
    }
    const name = tableName.trim();
    if (!TABLE_NAME_REGEX.test(name)) {
      return { code: -1, error: 'tableName은 영문, 숫자, 언더스코어만 허용됩니다.' };
    }

    const app = cloudbase.init({ context });
    const models = app.models;

    if (!models || typeof models.$runSQL !== 'function') {
      return {
        code: -1,
        error: '데이터 모델 또는 $runSQL을 사용할 수 없습니다.',
      };
    }

    // 테이블명은 검증됨. 백틱으로 이스케이프
    const result = await models.$runSQL(
      `SELECT * FROM \`${name}\` LIMIT {{limit}}`,
      { limit: MAX_ROWS }
    );

    const data = result?.data || result;
    const executeResultList = data?.executeResultList;
    if (!executeResultList || !Array.isArray(executeResultList)) {
      return { code: 0, data: { tableName: name, rows: [], columns: [] } };
    }

    const rows = executeResultList;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      code: 0,
      data: { tableName: name, columns, rows },
      requestId: context?.requestId,
    };
  } catch (err) {
    console.error('getTableData error:', err);
    return {
      code: -1,
      error: err?.message || String(err),
      requestId: context?.requestId,
    };
  }
};
