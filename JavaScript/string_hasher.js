/**
*   string_hasher.js is simply a file loaded into the background.html page to add
*   a Hash function to String objects in that scope. It is used because URLs
*   are a necessary identifier for our Firestore configuration, but '/' is disallowed
*   in Firestore IDs.
*
*   Credits (modified code): Bob Jenkins (http://www.burtleburtle.net/bob/hash/doobs.html)
*   See also: https://en.wikipedia.org/wiki/Jenkins_hash_function
*/

String.prototype.hashCode = function(ks)
{
    let hash = 0;
    let keyString = String(ks);

    for(let charIndex = 0; charIndex < keyString.length; ++charIndex)
    {
        hash += keyString.charCodeAt(charIndex);
        hash += hash << 10;
        hash ^= hash >> 6;
    }
    hash += hash << 3;
    hash ^= hash >> 11;

    //4,294,967,295 is FFFFFFFF, the maximum 32 bit unsigned integer value, used here as a mask.
    return (((hash + (hash << 15)) & 4294967295) >>> 0).toString(16);
}