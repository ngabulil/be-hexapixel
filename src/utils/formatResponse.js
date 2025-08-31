const formatResponse = (res, statusCode, message, data) => {
    return res.status(statusCode).json({
        message,
        result: data
    });
}

const formatResponsePagination = (res, statusCode, message, data, page, limit, totalPage, queryParams) => {
    const formattedData = data.map((item) => ({
        ...item,
        id: item._id
    }))
    return res.status(statusCode).json({
        message,
        result: formattedData,
        pagination: {
            page,
            limit,
            totalPage,
            // queryParams
        }
    });
}

module.exports = {
    formatResponse,
    formatResponsePagination
}