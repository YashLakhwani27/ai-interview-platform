import { Children } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({children}) {
    const token = localStorage.getItem("token");
    // console.log(token)

    if (!token){
        return <Navigate to={"/"}/>
    }
    return children;
}
export default ProtectedRoute;