import { RouteLoader } from "@/components/RouteLoader";

// Safe to mount here: nothing in this segment's subtree calls notFound(), so no
// HTTP status gets swallowed by the streamed shell. See components/RouteLoader.
export default RouteLoader;
