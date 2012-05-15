#!/usr/bin/env python

import sys
import getopt
import re
import json

# Tokenizer stolen from Einar Lielmanis et al.'s python version of jsbeautifier,
# MIT licence, enjoy.

def formatJSON(input):
    if input == None:
        return None
    return json.dumps(input)

def formatMD(input):
    if input == None:
        return None
    
    def process_tree(subtree, tabs):
        next_tabs = tabs + 1
        output = ""
        if 'name' in subtree and subtree['name'] != None:
            tab_str = ""
            for i in range(0, tabs):
                tab_str += "#"

            if 'type' in subtree:
                output += tab_str + ' ' + str(subtree['type']) + ": " + str(subtree['name']) + "\n"
            else:
                output += tab_str + ' ' + str(subtree['name']) + "\n"

            if 'doc' in subtree:
                output += str(subtree['doc']) + "\n"

            if 'type' in subtree and 'properties' in subtree:
                output += "\n"

                signature = 'Usage: __' + str(subtree['name']) + '('
                params = ""
                for prop in subtree['properties']:
                    if 'name' in prop:
                        output += '* __' + prop['type'] + '__ _' + prop['name'] + '_ '
                        if 'data-type' in prop:
                            output += " _(" + prop['data_type'] + ")_"
                        if 'description' in prop:
                            output += ": " + prop['description'] + "\n"
                    elif 'type' in prop:
                        if 'description' in prop:
                            output += '* __' + prop['type'] + "__: " + prop['description'] + "\n"

                    if 'name' in prop:
                        params += prop['name'] + ', '
                signature += params[:-2] + ')__'

                if not subtree['type'] in ["Module", "Property"]:
                    output += "\n" + signature + "\n"

            output += "\n"

        else:
            next_tabs = tabs

        for c in subtree['children']:
            output += process_tree(c, next_tabs)

        return output

    return process_tree(input, 1)

def formatTXT(input):
    if input == None:
        return None
    
    def process_tree(subtree, tabs):
        next_tabs = tabs + 1
        output = ""
        if subtree['name'] != None:
            tab_str = ""
            for i in range(0, tabs):
                tab_str += "  "
            output += tab_str
            if subtree['type'] != None:
                output += subtree['type'] + ": " + subtree['name'] + "\n"
            else:
                output += subtree['name'] + "\n"

            if subtree['doc'] != None:
                output += tab_str + subtree['doc'] + "\n"

            if subtree['properties'] != None:
                for prop in subtree['properties']:
                    if 'name' in prop:
                        output += tab_str + '@' + prop['type'] + ' ' + prop['name']
                        if prop['data_type'] != None:
                            output += " [" + prop['data_type'] + "]"
                        if prop['description'] != None:
                            output += ": " + prop['description'] + "\n"
                    elif 'type' in prop:
                        if prop['description'] != None:
                            output += tab_str + '@' + prop['type'] + ": " + prop['description'] + "\n"
                output += "\n"
        else:
            next_tabs = tabs

        for c in subtree['children']:
            output += process_tree(c, next_tabs)

        return output

    return process_tree(input, 0)


__processors = {
    'json': formatJSON,
    'txt': formatTXT,
    'md': formatMD
};

def process(string, opts = None):
    b = Dox()
    try:
        processor = opts['processor']
    except:
        processor = formatJSON
    
    return processor(b.beautify(string, opts))


def process_file(file_name, opts = None):

    if file_name == '-': # stdin
        f = sys.stdin
    else:
        f = open(file_name)

    b = Dox()

    try:
        processor = opts['processor']
    except:
        processor = formatJSON

    return processor(b.process(''.join(f.readlines()), opts))


def usage():

    print("""dox

Usage: dox.py [options] <infile>

    <infile> can be "-", which means stdin.
    <outfile> defaults to stdout

Input options:

 -i,  --stdin                      read input from stdin

Output options:

 -p,  --processor=PROCESSOR        specify an intermediary processor for data
 -o,  --outfile=FILE               specify a file to output to (default stdout)

Rarely needed options:

 -h,  --help, --usage              prints this help statement.

""");


class TreeProperties():
    def __init__(self):
        self.description = None
        self.type = None
        self.name = None
        self.properties = []


class Tree:
    def __init__(self, root=None):
        self.root = root
        self.children = []
        self.properties = TreeProperties()

    def clean(self):
        self.children = [child for child in self.children if not child.clean() ]
        return self.null_check()

    def export(self):
        children_export = []
        for child in self.children:
            if not child.null_check():
                children_export.append(child.export())

        p = self.properties
        return {
            'name': p.name,
            'type': p.type,
            'properties': p.properties,
            'doc': p.description,
            'children': children_export
        }

    def null_check(self):
        p = self.properties
        return len(self.children) == 0 and p.description == None and p.type == None and p.name == None and len(p.properties) == 0

class Flags:
    def __init__(self):
        self.in_html_comment = False

class Dox:

    def __init__(self, opts = None):

        self.opts = opts
        self.blank_state()

    def blank_state(self):

        # internal flags
        self.flags = Flags()
        self.flag_store = []


        self.last_word = ''              # last TK_WORD seen
        self.last_type = 'TK_START_EXPR' # last token type
        self.last_text = ''              # last token text
        self.last_last_text = ''         # pre-last token text

        self.input = None

        self.whitespace = ["\n", "\r", "\t", " "]
        self.wordchar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'
        self.digits = '0123456789'
        self.punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! !! , : ? ^ ^= |= ::'.split(' ');


        self.current_tree = Tree()
        self.root_tree = self.current_tree

        self.saved_properties = TreeProperties()

        global parser_pos
        parser_pos = 0


    def process(self, s, opts = None ):

        if opts != None:
            self.opts = opts

        self.blank_state()

        while s and s[0] in [' ', '\t']:
            self.preindent_string += s[0]
            s = s[1:]

        self.input = s

        parser_pos = 0
        while True:
            token_text, token_type = self.get_next_token()
            #print (token_text, token_type, self.flags.mode)
            if token_type == 'TK_EOF':
                break

            handlers = {
                'TK_START_EXPR': self.handle_start_expr,
                'TK_END_EXPR': self.handle_end_expr,
                'TK_START_BLOCK': self.handle_start_block,
                'TK_END_BLOCK': self.handle_end_block,
                'TK_WORD': self.handle_word,
                'TK_SEMICOLON': self.handle_semicolon,
                'TK_STRING': self.handle_string,
                'TK_EQUALS': self.handle_equals,
                'TK_OPERATOR': self.handle_operator,
                'TK_BLOCK_COMMENT': self.handle_block_comment,
                'TK_INLINE_COMMENT': self.handle_inline_comment,
                'TK_COMMENT': self.handle_comment,
                'TK_UNKNOWN': self.handle_unknown,
            }

            handlers[token_type](token_text)

            self.last_last_text = self.last_text
            self.last_type = token_type
            self.last_text = token_text

        self.root_tree.clean()
        export_data = self.root_tree.export()

        if self.root_tree.null_check():
            export_data = None

        return export_data


    def get_next_token(self):

        global parser_pos

        self.n_newlines = 0

        if parser_pos >= len(self.input):
            return '', 'TK_EOF'

        self.wanted_newline = False;
        c = self.input[parser_pos]
        parser_pos += 1

        while c in self.whitespace:
            if parser_pos >= len(self.input):
                return '', 'TK_EOF'

            c = self.input[parser_pos]
            parser_pos += 1

        if c in self.wordchar:
            if parser_pos < len(self.input):
                while self.input[parser_pos] in self.wordchar:
                    c = c + self.input[parser_pos]
                    parser_pos += 1
                    if parser_pos == len(self.input):
                        break

            # small and surprisingly unugly hack for 1E-10 representation
            if parser_pos != len(self.input) and self.input[parser_pos] in '+-' \
               and re.match('^[0-9]+[Ee]$', c):

                sign = self.input[parser_pos]
                parser_pos += 1
                t = self.get_next_token()
                c += sign + t[0]
                return c, 'TK_WORD'

            if c == 'in': # in is an operator, need to hack
                return c, 'TK_OPERATOR'

            return c, 'TK_WORD'

        if c in '([':
            return c, 'TK_START_EXPR'

        if c in ')]':
            return c, 'TK_END_EXPR'

        if c == '{':
            return c, 'TK_START_BLOCK'

        if c == '}':
            return c, 'TK_END_BLOCK'

        if c == ';':
            return c, 'TK_SEMICOLON'

        if c == '/':
            comment = ''
            inline_comment = True
            comment_mode = 'TK_INLINE_COMMENT'
            if self.input[parser_pos] == '*': # peek /* .. */ comment
                parser_pos += 1
                if parser_pos < len(self.input):
                    while not (self.input[parser_pos] == '*' and \
                               parser_pos + 1 < len(self.input) and \
                               self.input[parser_pos + 1] == '/')\
                          and parser_pos < len(self.input):
                        c = self.input[parser_pos]
                        comment += c
                        if c in '\r\n':
                            comment_mode = 'TK_BLOCK_COMMENT'
                        parser_pos += 1
                        if parser_pos >= len(self.input):
                            break
                parser_pos += 2
                return '/*' + comment + '*/', comment_mode
            if self.input[parser_pos] == '/': # peek // comment
                comment = c
                while self.input[parser_pos] not in '\r\n':
                    comment += self.input[parser_pos]
                    parser_pos += 1
                    if parser_pos >= len(self.input):
                        break
                parser_pos += 1
                return comment, 'TK_COMMENT'



        if c == "'" or c == '"' or \
           (c == '/' and ((self.last_type == 'TK_WORD' and self.last_text in ['return', 'do']) or \
                          (self.last_type in ['TK_COMMENT', 'TK_START_EXPR', 'TK_START_BLOCK', 'TK_END_BLOCK', 'TK_OPERATOR',
                                              'TK_EQUALS', 'TK_EOF', 'TK_SEMICOLON']))):
             sep = c
             esc = False
             resulting_string = c
             in_char_class = False

             if parser_pos < len(self.input):
                if sep == '/':
                    # handle regexp
                    in_char_class = False
                    while esc or in_char_class or self.input[parser_pos] != sep:
                        resulting_string += self.input[parser_pos]
                        if not esc:
                            esc = self.input[parser_pos] == '\\'
                            if self.input[parser_pos] == '[':
                                in_char_class = True
                            elif self.input[parser_pos] == ']':
                                in_char_class = False
                        else:
                            esc = False
                        parser_pos += 1
                        if parser_pos >= len(self.input):
                            # incomplete regex when end-of-file reached
                            # bail out with what has received so far
                            return resulting_string, 'TK_STRING'
                else:
                    # handle string
                    while esc or self.input[parser_pos] != sep:
                        resulting_string += self.input[parser_pos]
                        if not esc:
                            esc = self.input[parser_pos] == '\\'
                        else:
                            esc = False
                        parser_pos += 1
                        if parser_pos >= len(self.input):
                            # incomplete string when end-of-file reached
                            # bail out with what has received so far
                            return resulting_string, 'TK_STRING'


             parser_pos += 1
             resulting_string += sep
             if sep == '/':
                 # regexps may have modifiers /regexp/MOD, so fetch those too
                 while parser_pos < len(self.input) and self.input[parser_pos] in self.wordchar:
                     resulting_string += self.input[parser_pos]
                     parser_pos += 1
             return resulting_string, 'TK_STRING'

        if c == '#':

            # she-bang
            if len(self.output) == 0 and len(self.input) > 1 and self.input[parser_pos] == '!':
                resulting_string = c
                while parser_pos < len(self.input) and c != '\n':
                    c = self.input[parser_pos]
                    resulting_string += c
                    parser_pos += 1
                return self.get_next_token()


            # Spidermonkey-specific sharp variables for circular references
            # https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
            # http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp around line 1935
            sharp = '#'
            if parser_pos < len(self.input) and self.input[parser_pos] in self.digits:
                while True:
                    c = self.input[parser_pos]
                    sharp += c
                    parser_pos += 1
                    if parser_pos >= len(self.input)  or c == '#' or c == '=':
                        break
            if c == '#' or parser_pos >= len(self.input):
                pass
            elif self.input[parser_pos] == '[' and self.input[parser_pos + 1] == ']':
                sharp += '[]'
                parser_pos += 2
            elif self.input[parser_pos] == '{' and self.input[parser_pos + 1] == '}':
                sharp += '{}'
                parser_pos += 2
            return sharp, 'TK_WORD'

        if c == '<' and self.input[parser_pos - 1 : parser_pos + 3] == '<!--':
            parser_pos += 3
            self.flags.in_html_comment = True
            return '<!--', 'TK_COMMENT'

        if c == '-' and self.flags.in_html_comment and self.input[parser_pos - 1 : parser_pos + 2] == '-->':
            self.flags.in_html_comment = False
            parser_pos += 2
            return '-->', 'TK_COMMENT'

        if c in self.punct:
            while parser_pos < len(self.input) and c + self.input[parser_pos] in self.punct:
                c += self.input[parser_pos]
                parser_pos += 1
                if parser_pos >= len(self.input):
                    break
            if c == '=':
                return c, 'TK_EQUALS'
            else:
                return c, 'TK_OPERATOR'
        return c, 'TK_UNKNOWN'

    def push_tree(self):
        new_tree = Tree(self.current_tree)
        self.current_tree.children.append(new_tree)
        self.current_tree = new_tree

    def pop_tree(self):
        self.current_tree = self.current_tree.root

    def handle_start_expr(self, token_text):
        pass


    def handle_end_expr(self, token_text):
        pass


    def handle_start_block(self, token_text):
        self.push_tree()
        self.current_tree.properties = self.saved_properties
        self.saved_properties = TreeProperties()

    def handle_end_block(self, token_text):
        self.pop_tree()


    def handle_word(self, token_text):
        pass


    def handle_semicolon(self, token_text):
        pass


    def handle_string(self, token_text):
        pass


    def handle_equals(self, token_text):
        pass


    def handle_operator(self, token_text):
        pass


    def handle_block_comment(self, token_text):
        self.saved_properties = TreeProperties()
        result = re.search('\* ([A-Z]\w+):\s(\w+)', token_text)
        if result and result.group(1) and result.group(2):
            self.saved_properties.type = result.group(1)
            self.saved_properties.name = result.group(2)
        else:
            return

        lines = token_text.split('\n')[2:]
        description = []
        while len(lines) > 0:
            line = lines[0]
            trimmed = line.strip()[1:].strip()

            m = re.search('@(\w+):\s(.+)', trimmed)
            if m:
                self.saved_properties.properties.append({
                    'type': m.group(1),
                    'description': m.group(2)
                })

            else: 
                m = re.search('@(\w+)\s(\w+):\s(.+)', trimmed)
                if m:
                    self.saved_properties.properties.append({
                        'type': m.group(1),
                        'name': m.group(2),
                        'description': m.group(3)
                    })

                else:
                    m = re.search('@(\w+)\s\{(\w+)\}\s(\w+):\s(.+)', trimmed)
                    if m:
                        self.saved_properties.properties.append({
                            'type': m.group(1),
                            'data_type': m.group(2),
                            'name': m.group(3),
                            'description': m.group(4)
                        })
                    elif not trimmed in ['', '/']:
                        description.append(trimmed)

            lines = lines[1:]

        self.saved_properties.description = '\n'.join(description)
        

    def handle_inline_comment(self, token_text):
        pass


    def handle_comment(self, token_text):
        pass


    def handle_unknown(self, token_text):
        pass

def main():

    argv = sys.argv[1:]

    try:
        opts, args = getopt.getopt(argv, "o:t:i:h", ['outfile=', 'type=', 'help', 'usage', 'stdin'])
    except getopt.GetoptError:
        usage()
        sys.exit(2)

    options = {
        'processor': None
    }

    file = None
    outfile = 'stdout'
    
    if len(args) == 1:
        file = args[0]

    options['processor'] = formatJSON

    for opt, arg in opts:
        if opt in ('--outfile', '-o'):
            outfile = arg
        elif opt in ('--type', '-t'):
            try:
                options['processor'] = __processors[ arg ]
            except KeyError:
                pass
        elif opt in ('--stdin', '-i'):
            file = arg
        elif opt in ('--help', '--usage', '--h'):
            return usage()

    if file == None:
        return usage()
    else:
        output = process_file(file, options)
        if output != None:
            if outfile == 'stdout':
                print(output)
            else:
                f = open(outfile, 'w')
                f.write(output + '\n')
                f.close()


if __name__ == "__main__":
    main()


